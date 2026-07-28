import assert from "node:assert/strict";
import { mkdtemp, mkdir, readFile, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { bootstrap } from "../src/bootstrap.js";
import { reconcile, verifyIndex } from "../src/indexer.js";

async function fixture(): Promise<string> {
  const repo = await mkdtemp(path.join(os.tmpdir(), "cpi-fixture-"));
  await mkdir(path.join(repo, "src", "controllers"), { recursive: true });
  await mkdir(path.join(repo, "tests"), { recursive: true });
  await writeFile(path.join(repo, ".gitignore"), "generated/\n");
  await writeFile(path.join(repo, "src", "controllers", "auth.ts"), "export const auth = true;\n");
  await writeFile(path.join(repo, "tests", "auth.test.ts"), "test('auth', () => {});\n");
  await mkdir(path.join(repo, "generated"));
  await writeFile(path.join(repo, "generated", "skip.ts"), "secret-ish generated output");
  return repo;
}

test("bootstrap is non-destructive and idempotent", async () => {
  const repo = await fixture();
  await writeFile(path.join(repo, "CLAUDE.md"), "# Human instructions\n");
  await bootstrap(repo, false);
  const first = await readFile(path.join(repo, "CLAUDE.md"), "utf8");
  await bootstrap(repo, false);
  const second = await readFile(path.join(repo, "CLAUDE.md"), "utf8");
  assert.equal(first, second);
  assert.match(second, /Human instructions/);
});

test("manifest honors ignore rules and detects changes", async () => {
  const repo = await fixture();
  await bootstrap(repo, false);
  const manifest = await readFile(path.join(repo, ".claude/project-knowledge/manifests/files.jsonl"), "utf8");
  assert.match(manifest, /src\/controllers\/auth.ts/);
  assert.doesNotMatch(manifest, /generated\/skip.ts/);
  assert.deepEqual(await verifyIndex(repo), {
    valid: true,
    expected_hash: (await verifyIndex(repo) as any).expected_hash,
    actual_hash: (await verifyIndex(repo) as any).actual_hash,
    files: (await verifyIndex(repo) as any).files
  });
  await writeFile(path.join(repo, "src", "new.ts"), "new\n");
  const update = await reconcile(repo, true) as any;
  assert.deepEqual(update.added, ["src/new.ts"]);
});
