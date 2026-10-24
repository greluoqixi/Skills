import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, writeFile, rm, stat } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadConfig, saveConfig } from '../lib/store.js';

test('configuration round-trips atomically and falls back on corruption', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'dsh-voice-store-'));
  const locations = { data: join(temp, 'data'), models: join(temp, 'models'), venv: join(temp, 'venv'), config: join(temp, 'nested', 'config.json') };
  try {
    assert.deepEqual(await loadConfig(locations), { engine: 'sensevoice', modelDir: '', python: '', language: 'zh' });

    await saveConfig(locations, { engine: 'sensevoice', modelDir: '/models', python: '', language: 'ja' });
    assert.deepEqual(await loadConfig(locations), { engine: 'sensevoice', modelDir: '/models', python: '', language: 'ja' });
    assert.equal((await stat(locations.config)).mode & 0o777, 0o600);

    await writeFile(locations.config, '{not json');
    assert.deepEqual(await loadConfig(locations), { engine: 'sensevoice', modelDir: '', python: '', language: 'zh' });
  } finally {
    await rm(temp, { recursive: true, force: true });
  }
});
