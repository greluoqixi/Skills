import { mkdir, open, rename, rm } from "node:fs/promises";
import path from "node:path";
import { randomBytes } from "node:crypto";
import { assertWriteTarget } from "./paths.js";

export async function atomicWrite(repo: string, target: string, content: string): Promise<void> {
  await assertWriteTarget(repo, target);
  await mkdir(path.dirname(target), { recursive: true });
  const temporary = `${target}.tmp-${process.pid}-${randomBytes(6).toString("hex")}`;
  const handle = await open(temporary, "wx", 0o600);
  try {
    await handle.writeFile(content, "utf8");
    await handle.sync();
  } finally {
    await handle.close();
  }
  try {
    await rename(temporary, target);
  } catch (error) {
    await rm(temporary, { force: true });
    throw error;
  }
}
