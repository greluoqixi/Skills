import { isAbsolute, join } from 'node:path';
import { existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import {
  MAX_WAV_BYTES, engineFor, engineModelDir, modelReady, normalizeConfig, paths, resolvedModelDir, safeError, validateWav,
} from './core.js';
import { loadConfig, saveConfig } from './store.js';
import { readLimited, run } from './runner.js';

export const inject = ['connection'];

const runtimeDir = fileURLToPath(new URL('../runtime/', import.meta.url));
const locations = paths();
const STATUS_TTL_MS = 30_000;

/** @param body - JSON-serializable payload. @param status - HTTP status. */
function json(body, status = 200) {
  return Response.json(body, { status, headers: { 'cache-control': 'no-store' } });
}

function managedPython() {
  return process.platform === 'win32' ? join(locations.venv, 'Scripts', 'python.exe') : join(locations.venv, 'bin', 'python');
}

export function apply(ctx) {
  const lifetime = new AbortController();
  const jobs = new Set();
  // The runtime probe spawns a Python interpreter, so its answer is reused for a
  // short window and dropped whenever configuration or setup could invalidate it.
  const probe = { key: '', at: 0, ready: false };
  let setupJob = null;

  ctx.effect(() => async () => {
    lifetime.abort();
    await Promise.allSettled([...jobs]);
  }, 'voice-input: terminate workers');

  function track(promise) {
    jobs.add(promise);
    promise.finally(() => jobs.delete(promise)).catch(() => {});
    return promise;
  }

  function invalidate() {
    probe.key = '';
    probe.at = 0;
  }

  /**
   * Decide whether the selected interpreter can actually import the offline
   * engine. Only a successful import counts, so a stale venv never reports ready.
   * @param python - absolute interpreter path.
   * @returns whether the runtime is usable.
   */
  async function runtimeReady(python) {
    const now = Date.now();
    if (probe.key === python && now - probe.at < STATUS_TTL_MS) return probe.ready;
    let ready = false;
    if (existsSync(python)) {
      try {
        await run(python, ['-c', 'import sherpa_onnx, numpy'], null, lifetime.signal, 10_000);
        ready = true;
      } catch { /* The interpreter exists but cannot load the offline engine. */ }
    }
    probe.key = python;
    probe.at = now;
    probe.ready = ready;
    return ready;
  }

  const routes = [
    { path: '/api/voice.status', methods: ['GET'], requestBody: 'buffered', fetch: async () => {
      const config = await loadConfig(locations);
      const engine = engineFor(config);
      const modelDir = resolvedModelDir(config, locations);
      const python = config.python || managedPython();
      return json({
        config,
        engine: { id: engine.id, label: engine.label },
        modelReady: modelReady(modelDir, engine),
        runtimeReady: await runtimeReady(python),
        managedModel: !config.modelDir,
        managedPython: !config.python,
        modelDir,
        python,
        defaults: {
          modelDir: engineModelDir(engine, locations),
          python: managedPython(),
          dataDir: locations.data,
          venv: locations.venv,
          config: locations.config,
        },
        setupRunning: !!setupJob,
      });
    } },
    { path: '/api/voice.config', methods: ['POST'], requestBody: 'buffered', fetch: async request => {
      try {
        // Merge over the stored document so a caller can update one field without
        // having to know the rest of the schema.
        const current = await loadConfig(locations);
        const config = normalizeConfig({ ...current, ...(await request.json()) });
        await saveConfig(locations, config);
        invalidate();
        return json({ config });
      } catch (error) { return json({ error: safeError(error) }, 400); }
    } },
    { path: '/api/voice.setup', methods: ['POST'], requestBody: 'buffered', fetch: async () => {
      if (setupJob) return json({ error: 'Setup already running' }, 409);
      const current = await loadConfig(locations);
      // Managed setup owns both locations, so clear manual overrides in the same
      // request instead of asking the browser to save first.
      const config = normalizeConfig({ ...current, modelDir: '', python: '' });
      await saveConfig(locations, config);
      invalidate();
      const engine = engineFor(config);
      const args = [
        join(runtimeDir, engine.setupScript),
        '--data-dir', locations.data,
        '--model-dir', engineModelDir(engine, locations),
        '--model-url', `${engine.source}/${engine.archive}`,
        '--files', engine.files.join(','),
      ];
      setupJob = track(run(process.env.DSH_VOICE_PYTHON || 'python3', args, null, lifetime.signal, 20 * 60 * 1000));
      try {
        await setupJob;
        invalidate();
        return json({ ready: true, config });
      } catch (error) {
        return json({ error: safeError(error) }, 500);
      } finally { setupJob = null; }
    } },
    { path: '/api/voice.resolve-python', methods: ['POST'], requestBody: 'buffered', fetch: async request => {
      try {
        const body = await request.json();
        const dir = typeof body?.dir === 'string' ? body.dir : '';
        if (!dir || !isAbsolute(dir)) return json({ error: 'Directory must be an absolute path' }, 400);
        // Only the host can look inside the chosen folder, so the browser sends a
        // directory and receives the interpreter it contains (venv or bare folder).
        const candidates = process.platform === 'win32'
          ? [join(dir, 'python.exe'), join(dir, 'Scripts', 'python.exe'), join(dir, 'bin', 'python.exe')]
          : [join(dir, 'bin', 'python'), join(dir, 'bin', 'python3'), join(dir, 'python'), join(dir, 'python3')];
        const found = candidates.find(candidate => existsSync(candidate));
        return json({ path: found ?? null, candidates });
      } catch (error) { return json({ error: safeError(error) }, 400); }
    } },
    { path: '/api/voice.transcribe', methods: ['POST'], requestBody: 'streaming', fetch: async request => {
      try {
        const config = await loadConfig(locations);
        const engine = engineFor(config);
        const modelDir = resolvedModelDir(config, locations);
        const python = config.python || managedPython();
        if (!modelReady(modelDir, engine)) return json({ error: 'Model files are missing; open voice settings' }, 409);
        if (!existsSync(python)) return json({ error: 'Python runtime is missing; open voice settings' }, 409);
        const wav = await readLimited(request, MAX_WAV_BYTES);
        if (!validateWav(wav)) return json({ error: 'Expected 16 kHz mono PCM WAV' }, 400);
        const signal = AbortSignal.any([lifetime.signal, request.signal]);
        const result = await track(run(python, [
          join(runtimeDir, engine.transcribeScript),
          '--model-dir', modelDir,
          '--language', config.language,
        ], wav, signal, 120_000));
        return json(JSON.parse(result));
      } catch (error) { return json({ error: safeError(error) }, 500); }
    } },
  ];
  for (const route of routes) ctx.effect(() => ctx.connection.fetch.register(route), `voice-input: ${route.path}`);
}
