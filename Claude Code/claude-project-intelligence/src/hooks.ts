import { createHash } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import { reconcile } from "./indexer.js";

interface HookInput {
  session_id?: string;
  permission_mode?: string;
  cwd?: string;
  hook_event_name?: string;
}

async function stdinJson(): Promise<HookInput> {
  let text = "";
  for await (const chunk of process.stdin) text += String(chunk);
  if (!text.trim()) return {};
  try { return JSON.parse(text) as HookInput; } catch { return {}; }
}

function runtimeDirectory(repo: string): string {
  const base = process.env.CLAUDE_PLUGIN_DATA;
  if (!base) return "";
  const id = createHash("sha256").update(repo).digest("hex");
  return path.join(base, "workspaces", id);
}

async function initialized(repo: string): Promise<boolean> {
  return Boolean(await readFile(path.join(repo, ".claude", "project-intelligence.yaml"), "utf8").catch(() => ""));
}

export async function markDirty(repo: string): Promise<Record<string, unknown>> {
  const input = await stdinJson();
  if (input.permission_mode === "plan" || !(await initialized(repo))) return { skipped: true };
  const runtime = runtimeDirectory(repo);
  if (!runtime) return { skipped: true, reason: "CLAUDE_PLUGIN_DATA unavailable" };
  await mkdir(runtime, { recursive: true });
  await writeFile(path.join(runtime, "dirty.json"), JSON.stringify({
    session_id: input.session_id ?? null,
    event: input.hook_event_name ?? null,
    updated_at: new Date().toISOString()
  }) + "\n", { encoding: "utf8", mode: 0o600 });
  return { dirty: true };
}

export async function reconcileIfDirty(repo: string): Promise<Record<string, unknown>> {
  await stdinJson();
  if (!(await initialized(repo))) return { skipped: true };
  const runtime = runtimeDirectory(repo);
  const marker = runtime ? path.join(runtime, "dirty.json") : "";
  if (!marker || !(await readFile(marker, "utf8").catch(() => ""))) return { skipped: true, reason: "clean" };
  const result = await reconcile(repo, false);
  await rm(marker, { force: true });
  return result;
}

export async function checkStale(repo: string): Promise<Record<string, unknown>> {
  await stdinJson();
  if (!(await initialized(repo))) return { skipped: true };
  const runtime = runtimeDirectory(repo);
  const dirty = runtime ? Boolean(await readFile(path.join(runtime, "dirty.json"), "utf8").catch(() => "")) : false;
  return dirty ? { systemMessage: "Project intelligence is dirty; reconcile before relying on it." } : { clean: true };
}
