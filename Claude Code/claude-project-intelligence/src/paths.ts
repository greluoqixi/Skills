import { lstat, realpath } from "node:fs/promises";
import path from "node:path";
import { CpiError } from "./errors.js";

export function normalizeRepoRelative(input: string): string {
  if (!input || input.includes("\0") || path.isAbsolute(input) || /^[A-Za-z]:[\\/]/.test(input)) {
    throw new CpiError(`Unsafe repository-relative path: ${JSON.stringify(input)}`, 4);
  }
  const normalized = input.replaceAll("\\", "/").replace(/^\.\/+/, "");
  const parts = normalized.split("/");
  if (parts.some((part) => part === "" || part === "." || part === "..")) {
    throw new CpiError(`Path traversal or empty path segment: ${JSON.stringify(input)}`, 4);
  }
  return parts.join("/");
}

export function assertModuleId(id: string): string {
  const pattern = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*(?:\.[a-z][a-z0-9]*(?:-[a-z0-9]+)*)*$/;
  if (id.length > 128 || !pattern.test(id) || id.split(".").length > 6) {
    throw new CpiError(`Invalid module ID: ${id}`, 2);
  }
  return id;
}

export async function canonicalRepo(input: string): Promise<string> {
  const resolved = path.resolve(input);
  const stat = await lstat(resolved).catch(() => null);
  if (!stat?.isDirectory()) throw new CpiError(`Repository root is not a directory: ${resolved}`, 4);
  return realpath(resolved);
}

export async function assertWriteTarget(repo: string, target: string): Promise<void> {
  const resolved = path.resolve(target);
  const parent = await realpath(path.dirname(resolved)).catch(() => path.resolve(path.dirname(resolved)));
  const relative = path.relative(repo, parent);
  if (relative.startsWith("..") || path.isAbsolute(relative)) {
    throw new CpiError(`Refusing to write outside repository: ${resolved}`, 4);
  }
  const allowed = resolved === path.join(repo, "CLAUDE.md") ||
    resolved.startsWith(path.join(repo, ".claude") + path.sep);
  if (!allowed) throw new CpiError(`Write target is outside the allowed knowledge paths: ${resolved}`, 4);
}
