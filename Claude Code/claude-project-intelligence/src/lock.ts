import { createHash } from "node:crypto";
import { mkdir, open, readFile, rm, stat } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { CpiError } from "./errors.js";

const wait = (milliseconds: number) => new Promise((resolve) => setTimeout(resolve, milliseconds));

export async function withRepoLock<T>(repo: string, operation: () => Promise<T>): Promise<T> {
  const root = process.env.CLAUDE_PLUGIN_DATA
    ? path.join(process.env.CLAUDE_PLUGIN_DATA, "locks")
    : path.join(os.tmpdir(), "claude-project-intelligence-locks");
  await mkdir(root, { recursive: true });
  const id = createHash("sha256").update(repo).digest("hex");
  const lockPath = path.join(root, `${id}.lock`);
  const deadline = Date.now() + 10_000;
  let handle;
  while (!handle && Date.now() < deadline) {
    try {
      handle = await open(lockPath, "wx", 0o600);
      await handle.writeFile(JSON.stringify({ pid: process.pid, repo, created_at: new Date().toISOString() }));
      await handle.sync();
    } catch (error: any) {
      if (error?.code !== "EEXIST") throw error;
      const age = Date.now() - (await stat(lockPath).catch(() => ({ mtimeMs: Date.now() }))).mtimeMs;
      if (age > 60_000) {
        const contents = await readFile(lockPath, "utf8").catch(() => "");
        await rm(lockPath, { force: true });
        if (contents) continue;
      }
      await wait(50);
    }
  }
  if (!handle) throw new CpiError("Timed out waiting for the repository index lock.", 5);
  try {
    return await operation();
  } finally {
    await handle.close();
    await rm(lockPath, { force: true });
  }
}
