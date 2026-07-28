import { createHash } from "node:crypto";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";
import { atomicWrite } from "./atomic.js";
import { loadConfig } from "./config.js";
import { gitMetadata } from "./git.js";
import { scanRepository } from "./scan.js";
import type { FileRecord, ModuleCard, State } from "./types.js";
import { CpiError } from "./errors.js";
import { validateSchema } from "./schemas.js";
import { withRepoLock } from "./lock.js";

export const GENERATOR_VERSION = "0.1.0";

const knowledge = (repo: string) => path.join(repo, ".claude", "project-knowledge");
const manifestPath = (repo: string) => path.join(knowledge(repo), "manifests", "files.jsonl");

function jsonl(records: unknown[]): string {
  return records.map((record) => JSON.stringify(record)).join("\n") + (records.length ? "\n" : "");
}

function digest(text: string): string {
  return `sha256:${createHash("sha256").update(text).digest("hex")}`;
}

export async function readManifest(repo: string): Promise<FileRecord[]> {
  const text = await readFile(manifestPath(repo), "utf8").catch(() => "");
  return text.split("\n").filter(Boolean).map((line) => JSON.parse(line) as FileRecord);
}

async function reconcileUnlocked(repo: string, dryRun: boolean): Promise<Record<string, unknown>> {
  const config = await loadConfig(repo);
  const previous = await readManifest(repo);
  const current = await scanRepository(repo, config);
  const before = new Map(previous.map((x) => [x.path, x]));
  const after = new Map(current.map((x) => [x.path, x]));
  const added = current.filter((x) => !before.has(x.path)).map((x) => x.path);
  const deleted = previous.filter((x) => !after.has(x.path)).map((x) => x.path);
  const changed = current.filter((x) => before.has(x.path) && before.get(x.path)?.hash !== x.hash).map((x) => x.path);
  const deletedByHash = new Map(previous.filter((x) => deleted.includes(x.path)).map((x) => [x.hash, x.path]));
  const renames = added
    .map((to) => ({ from: deletedByHash.get(after.get(to)?.hash ?? ""), to }))
    .filter((x): x is { from: string; to: string } => Boolean(x.from));

  const manifest = jsonl(current);
  const git = await gitMetadata(repo);
  const state: State = {
    schema_version: "1.0",
    generator_version: GENERATOR_VERSION,
    repository_id: digest(repo),
    branch: git.branch,
    commit: git.commit,
    dirty: git.dirty,
    manifest_hash: digest(manifest),
    updated_at: new Date().toISOString()
  };
  for (const record of current) validateSchema("file-manifest", record);
  validateSchema("state", state);
  if (!dryRun) {
    await mkdir(path.join(knowledge(repo), "manifests"), { recursive: true });
    await atomicWrite(repo, manifestPath(repo), manifest);
    await atomicWrite(repo, path.join(knowledge(repo), "manifests", "state.json"), JSON.stringify(state, null, 2) + "\n");
  }
  return { added, changed, deleted, renames, files: current.length, state, dry_run: dryRun };
}

export async function reconcile(repo: string, dryRun = false): Promise<Record<string, unknown>> {
  return withRepoLock(repo, () => reconcileUnlocked(repo, dryRun));
}

export async function verifyIndex(repo: string): Promise<Record<string, unknown>> {
  const stored = await readManifest(repo);
  if (!stored.length) throw new CpiError("No file manifest. Run bootstrap or index build.", 3);
  const config = await loadConfig(repo);
  const current = await scanRepository(repo, config);
  const expected = jsonl(current);
  const actual = jsonl(stored);
  const valid = expected === actual;
  return { valid, expected_hash: digest(expected), actual_hash: digest(actual), files: stored.length };
}

export async function loadModules(repo: string): Promise<ModuleCard[]> {
  const directory = path.join(knowledge(repo), "modules");
  const { readdir } = await import("node:fs/promises");
  const names = await readdir(directory).catch(() => []);
  const cards: ModuleCard[] = [];
  for (const name of names.filter((x) => x.endsWith(".yaml")).sort()) {
    cards.push(YAML.parse(await readFile(path.join(directory, name), "utf8")) as ModuleCard);
  }
  return cards;
}

export async function searchModules(repo: string, query: string, limit: number): Promise<unknown[]> {
  const cards = await loadModules(repo);
  const terms = query.toLowerCase().split(/[^a-z0-9_.-]+/).filter(Boolean);
  return cards.map((card) => {
    const fields = [
      card.id, card.name, card.summary, card.path,
      ...card.routing_terms, ...card.responsibilities, ...card.non_responsibilities
    ].join(" ").toLowerCase();
    const matched = terms.filter((term) => fields.includes(term));
    return {
      id: card.id, path: card.path, summary: card.summary,
      score: matched.length, reasons: matched.map((term) => `matched:${term}`)
    };
  }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).slice(0, limit);
}
