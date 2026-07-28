import assert from "node:assert/strict";
import { mkdtemp } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import test from "node:test";
import { withRepoLock } from "../src/lock.js";

test("serializes concurrent repository updates", async () => {
  const repo = await mkdtemp(path.join(os.tmpdir(), "cpi-lock-fixture-"));
  const events: string[] = [];
  await Promise.all(Array.from({ length: 8 }, (_, index) =>
    withRepoLock(repo, async () => {
      events.push(`start:${index}`);
      await new Promise((resolve) => setTimeout(resolve, 5));
      events.push(`end:${index}`);
    })
  ));
  for (let index = 0; index < events.length; index += 2) {
    assert.match(events[index], /^start:/);
    assert.match(events[index + 1], /^end:/);
  }
});
