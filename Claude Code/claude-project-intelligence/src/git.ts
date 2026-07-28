import { execFile } from "node:child_process";
import { promisify } from "node:util";

const exec = promisify(execFile);

export async function git(repo: string, args: string[]): Promise<string | null> {
  try {
    const { stdout } = await exec("git", ["-C", repo, ...args], {
      encoding: "utf8",
      maxBuffer: 16 * 1024 * 1024,
      windowsHide: true
    });
    return stdout.trim();
  } catch {
    return null;
  }
}

export async function gitMetadata(repo: string): Promise<{ branch: string | null; commit: string | null; dirty: boolean }> {
  const [branch, commit, status] = await Promise.all([
    git(repo, ["branch", "--show-current"]),
    git(repo, ["rev-parse", "HEAD"]),
    git(repo, ["status", "--porcelain=v2", "-z", "--untracked-files=normal"])
  ]);
  return { branch: branch || null, commit: commit || null, dirty: Boolean(status) };
}
