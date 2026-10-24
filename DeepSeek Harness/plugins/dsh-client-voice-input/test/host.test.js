import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

test('host registers authenticated routes and stores per-user settings', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'dsh-voice-host-'));
  const oldData = process.env.XDG_DATA_HOME;
  const oldConfig = process.env.XDG_CONFIG_HOME;
  process.env.XDG_DATA_HOME = join(temp, 'data');
  process.env.XDG_CONFIG_HOME = join(temp, 'config');
  try {
    const { apply } = await import('../lib/index.js');
    const routes = new Map();
    const cleanups = [];
    apply({
      effect(register) { cleanups.push(register()); },
      connection: { fetch: { register(route) {
        routes.set(route.path, route);
        return async () => routes.delete(route.path);
      } } },
    });
    assert.equal(routes.size, 5);
    const status = await routes.get('/api/voice.status').fetch(new Request('http://localhost/api/voice.status'));
    const snapshot = await status.json();
    assert.equal(snapshot.modelReady, false);
    // A fresh profile still reports the managed paths, so the settings surface can
    // show what will be used before anything is downloaded.
    assert.deepEqual(snapshot.engine, { id: 'sensevoice', label: 'SenseVoiceSmall INT8' });
    assert.equal(snapshot.managedModel, true);
    assert.equal(snapshot.managedPython, true);
    assert.equal(snapshot.modelDir, join(temp, 'data', 'dsh-client-voice-input', 'models', 'sensevoice-small-int8'));
    assert.equal(snapshot.python, join(temp, 'data', 'dsh-client-voice-input', 'venv', 'bin', 'python'));
    assert.equal(snapshot.defaults.modelDir, snapshot.modelDir);
    assert.equal(snapshot.defaults.python, snapshot.python);
    assert.equal(snapshot.defaults.config, join(temp, 'config', 'dsh-client-voice-input', 'config.json'));
    const update = await routes.get('/api/voice.config').fetch(new Request('http://localhost/api/voice.config', {
      method: 'POST', body: JSON.stringify({ language: 'auto', modelDir: join(temp, 'model'), python: '' }),
    }));
    assert.equal(update.status, 200);
    const stored = JSON.parse(await readFile(join(temp, 'config', 'dsh-client-voice-input', 'config.json'), 'utf8'));
    assert.equal(stored.language, 'auto');
    assert.equal(stored.modelDir, join(temp, 'model'));
    // Partial updates merge over the stored document.
    const partial = await routes.get('/api/voice.config').fetch(new Request('http://localhost/api/voice.config', {
      method: 'POST', body: JSON.stringify({ language: 'en' }),
    }));
    assert.equal(partial.status, 200);
    const merged = JSON.parse(await readFile(join(temp, 'config', 'dsh-client-voice-input', 'config.json'), 'utf8'));
    assert.equal(merged.language, 'en');
    assert.equal(merged.modelDir, join(temp, 'model'));
    const bad = await routes.get('/api/voice.config').fetch(new Request('http://localhost/api/voice.config', {
      method: 'POST', body: JSON.stringify({ modelDir: '../relative' }),
    }));
    assert.equal(bad.status, 400);

    // A chosen folder is resolved to the interpreter it contains.
    const env = join(temp, 'venv');
    await mkdir(join(env, 'bin'), { recursive: true });
    await writeFile(join(env, 'bin', 'python'), '');
    const resolved = await routes.get('/api/voice.resolve-python').fetch(new Request('http://localhost/api/voice.resolve-python', {
      method: 'POST', body: JSON.stringify({ dir: env }),
    }));
    assert.deepEqual((await resolved.json()).path, join(env, 'bin', 'python'));
    const outside = await routes.get('/api/voice.resolve-python').fetch(new Request('http://localhost/api/voice.resolve-python', {
      method: 'POST', body: JSON.stringify({ dir: 'relative/path' }),
    }));
    assert.equal(outside.status, 400);

    for (const cleanup of cleanups.reverse()) await cleanup();
  } finally {
    if (oldData === undefined) delete process.env.XDG_DATA_HOME; else process.env.XDG_DATA_HOME = oldData;
    if (oldConfig === undefined) delete process.env.XDG_CONFIG_HOME; else process.env.XDG_CONFIG_HOME = oldConfig;
    await rm(temp, { recursive: true, force: true });
  }
});
