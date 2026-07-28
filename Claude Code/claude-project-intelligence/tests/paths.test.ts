import assert from "node:assert/strict";
import test from "node:test";
import { assertModuleId, normalizeRepoRelative } from "../src/paths.js";

test("normalizes safe repository paths", () => {
  assert.equal(normalizeRepoRelative("./src/auth.ts"), "src/auth.ts");
});

test("rejects traversal and absolute paths", () => {
  for (const value of ["../secret", "/etc/passwd", "C:\\secret", "src/../secret", "a//b"]) {
    assert.throws(() => normalizeRepoRelative(value));
  }
});

test("validates stable module IDs", () => {
  assert.equal(assertModuleId("identity.authentication"), "identity.authentication");
  assert.equal(assertModuleId("shared.http-client"), "shared.http-client");
  assert.throws(() => assertModuleId("Identity.Auth"));
  assert.throws(() => assertModuleId("identity..auth"));
});
