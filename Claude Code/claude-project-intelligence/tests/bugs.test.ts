import assert from "node:assert/strict";
import test from "node:test";
import { assertNoSecrets, fingerprint, normalizeMessage } from "../src/bugs.js";

test("normalizes unstable error fields", () => {
  const result = normalizeMessage("2026-07-28T12:03:02Z /tmp/app.ts:42 id 123456 0xdeadbeef");
  assert.match(result, /<timestamp>/);
  assert.match(result, /<path>/);
  assert.match(result, /<id>/);
  assert.match(result, /<address>/);
});

test("fingerprints are deterministic and versioned", () => {
  assert.equal(fingerprint("normalized-message", "Error 123456"), fingerprint("normalized-message", "Error 999999"));
  assert.match(fingerprint("error-code", "AUTH-401"), /^error-code\/v1:sha256:/);
});

test("rejects common credentials", () => {
  assert.throws(() => assertNoSecrets("password=super-secret-value"));
  assert.doesNotThrow(() => assertNoSecrets("password was rejected"));
});
