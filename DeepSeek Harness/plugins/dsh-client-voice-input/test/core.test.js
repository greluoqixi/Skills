import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, mkdir, writeFile, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { modelReady, normalizeConfig, paths, validateWav } from '../lib/core.js';

function wav(samples = 160) {
  const bytes = Buffer.alloc(44 + samples * 2);
  bytes.write('RIFF', 0); bytes.writeUInt32LE(bytes.length - 8, 4); bytes.write('WAVE', 8);
  bytes.write('fmt ', 12); bytes.writeUInt32LE(16, 16); bytes.writeUInt16LE(1, 20);
  bytes.writeUInt16LE(1, 22); bytes.writeUInt32LE(16000, 24); bytes.writeUInt32LE(32000, 28);
  bytes.writeUInt16LE(2, 32); bytes.writeUInt16LE(16, 34);
  bytes.write('data', 36); bytes.writeUInt32LE(samples * 2, 40);
  return bytes;
}

test('accepts only canonical bounded 16 kHz mono PCM recordings', () => {
  const valid = wav();
  assert.equal(validateWav(valid), true);
  const stereo = Buffer.from(valid); stereo.writeUInt16LE(2, 22);
  assert.equal(validateWav(stereo), false);
  const truncated = valid.subarray(0, valid.length - 2);
  assert.equal(validateWav(truncated), false);
  assert.equal(validateWav(Buffer.alloc(3_000_001)), false);
});

test('manual configuration requires portable absolute paths and supported languages', () => {
  assert.deepEqual(normalizeConfig({}), { engine: 'sensevoice', modelDir: '', python: '', language: 'zh' });
  assert.throws(() => normalizeConfig({ modelDir: './private' }));
  assert.throws(() => normalizeConfig({ python: 'python3' }));
  assert.throws(() => normalizeConfig({ language: 'invalid' }));
  assert.throws(() => normalizeConfig({ engine: 'cloud-something' }));
});

test('a leading tilde expands instead of forcing a machine path', () => {
  const home = '/home/example';
  assert.deepEqual(normalizeConfig({ modelDir: '~/models', python: '~/venv/bin/python' }, home), {
    engine: 'sensevoice', modelDir: '/home/example/models', python: '/home/example/venv/bin/python', language: 'zh',
  });
});

test('DSH_VOICE_HOME keeps every artifact under one directory', () => {
  const env = { DSH_VOICE_HOME: '/opt/voice' };
  assert.deepEqual(paths(env), {
    data: '/opt/voice/data',
    config: '/opt/voice/config.json',
    models: '/opt/voice/data/models',
    venv: '/opt/voice/data/venv',
  });
});

test('model directory must contain both model and token files', async () => {
  const temp = await mkdtemp(join(tmpdir(), 'dsh-voice-test-'));
  try {
    await mkdir(temp, { recursive: true });
    assert.equal(modelReady(temp), false);
    await writeFile(join(temp, 'model.int8.onnx'), 'model');
    assert.equal(modelReady(temp), false);
    await writeFile(join(temp, 'tokens.txt'), 'tokens');
    assert.equal(modelReady(temp), true);
  } finally { await rm(temp, { recursive: true, force: true }); }
});
