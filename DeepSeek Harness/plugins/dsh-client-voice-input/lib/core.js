import { homedir } from 'node:os';
import { join, isAbsolute } from 'node:path';
import { existsSync } from 'node:fs';

/**
 * Engine registry. Everything an engine needs — layout, download source, file
 * names, supported languages, adapter scripts — lives here, so adding a local
 * recognizer is a data change plus two runtime scripts, not a host rewrite.
 */
export const ENGINES = {
  sensevoice: {
    id: 'sensevoice',
    label: 'SenseVoiceSmall INT8',
    directory: 'sensevoice-small-int8',
    archive: 'sherpa-onnx-sense-voice-zh-en-ja-ko-yue-int8-2024-07-17.tar.bz2',
    source: 'https://github.com/k2-fsa/sherpa-onnx/releases/download/asr-models',
    files: ['model.int8.onnx', 'tokens.txt'],
    languages: ['zh', 'auto', 'en', 'yue', 'ja', 'ko'],
    setupScript: 'setup.py',
    transcribeScript: 'transcribe.py',
  },
};

export const DEFAULT_ENGINE = 'sensevoice';

/** @param id - engine identifier from configuration. @returns its descriptor or null. */
export function engineOf(id) {
  return Object.hasOwn(ENGINES, id) ? ENGINES[id] : null;
}

/** @param config - normalized configuration. @returns the descriptor it selects. */
export function engineFor(config) {
  return engineOf(config.engine) ?? ENGINES[DEFAULT_ENGINE];
}

export const MODEL_ARCHIVE = ENGINES[DEFAULT_ENGINE].archive;
export const MODEL_URL = `${ENGINES[DEFAULT_ENGINE].source}/${MODEL_ARCHIVE}`;
export const MAX_WAV_BYTES = 3_000_000;

/** @param name - environment variable. @param fallback - home-relative default. @param env - environment. */
export function xdgDir(name, fallback, env = process.env) {
  const value = env[name];
  return value && isAbsolute(value) ? value : join(homedir(), fallback);
}

/**
 * Resolve every location the plugin owns. `DSH_VOICE_HOME` collapses data and
 * configuration into one self-contained directory, which keeps tests and
 * portable installs off the global XDG tree.
 * @param env - environment to read.
 * @returns absolute data, config, models, and venv locations.
 */
export function paths(env = process.env) {
  const override = env.DSH_VOICE_HOME;
  if (override && isAbsolute(override)) {
    const data = join(override, 'data');
    return { data, config: join(override, 'config.json'), models: join(data, 'models'), venv: join(data, 'venv') };
  }
  const data = join(xdgDir('XDG_DATA_HOME', '.local/share', env), 'dsh-client-voice-input');
  return {
    data,
    config: join(xdgDir('XDG_CONFIG_HOME', '.config', env), 'dsh-client-voice-input', 'config.json'),
    models: join(data, 'models'),
    venv: join(data, 'venv'),
  };
}

/** @param engine - descriptor. @param locations - resolved paths. @returns the managed model directory. */
export function engineModelDir(engine, locations) {
  return join(locations.models, engine.directory);
}

/**
 * Expand a leading `~` so users can type `~/models` instead of a machine path.
 * @param value - user-supplied path.
 * @param home - home directory to substitute.
 * @returns the expanded value.
 */
export function expandHome(value, home = homedir()) {
  if (typeof value !== 'string') return value;
  if (value === '~') return home;
  if (value.startsWith('~/') || value.startsWith('~\\')) return join(home, value.slice(2));
  return value;
}

/**
 * Validate and normalize stored configuration. Empty paths mean "use the
 * managed location"; non-empty ones must resolve to absolute paths so the host
 * never guesses at a working directory.
 * @param value - untrusted configuration object.
 * @param home - home directory for `~` expansion.
 * @returns the normalized configuration.
 */
export function normalizeConfig(value, home = homedir()) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Invalid configuration');
  const engine = value.engine ?? DEFAULT_ENGINE;
  const definition = engineOf(engine);
  if (!definition) throw new Error('Unsupported recognition engine');
  const modelDir = expandHome(value.modelDir ?? '', home);
  const python = expandHome(value.python ?? '', home);
  const language = value.language ?? 'zh';
  if (typeof modelDir !== 'string' || modelDir.length > 1024 || (modelDir && !isAbsolute(modelDir))) {
    throw new Error('Model directory must be an absolute path or empty');
  }
  if (typeof python !== 'string' || python.length > 1024 || (python && !isAbsolute(python))) {
    throw new Error('Python executable must be an absolute path or empty');
  }
  if (!definition.languages.includes(language)) throw new Error('Unsupported language');
  return { engine, modelDir, python, language };
}

/** @param config - normalized configuration. @param locations - resolved paths. */
export function resolvedModelDir(config, locations = paths()) {
  return config.modelDir || engineModelDir(engineFor(config), locations);
}

/** @param dir - model directory. @param engine - descriptor whose files must exist. */
export function modelReady(dir, engine = ENGINES[DEFAULT_ENGINE]) {
  return engine.files.every(name => existsSync(join(dir, name)));
}

/** @param bytes - candidate WAV body. */
export function validateWav(bytes) {
  if (!Buffer.isBuffer(bytes) || bytes.length < 44 || bytes.length > MAX_WAV_BYTES) return false;
  if (bytes.toString('ascii', 0, 4) !== 'RIFF' || bytes.toString('ascii', 8, 12) !== 'WAVE') return false;
  // The client writes canonical 16 kHz mono signed PCM. The worker checks again.
  return bytes.toString('ascii', 12, 16) === 'fmt ' && bytes.readUInt16LE(20) === 1 &&
    bytes.readUInt16LE(22) === 1 && bytes.readUInt32LE(24) === 16000 &&
    bytes.readUInt16LE(34) === 16 && bytes.toString('ascii', 36, 40) === 'data' &&
    bytes.readUInt32LE(40) === bytes.length - 44;
}

/** @param error - any thrown value. @returns a single-line message safe to return to the browser. */
export function safeError(error) {
  const message = error instanceof Error ? error.message : String(error);
  return message.slice(0, 300).replace(/[\r\n]+/g, ' ');
}
