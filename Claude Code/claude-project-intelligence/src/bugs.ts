import { createHash } from "node:crypto";
import { mkdir, readFile, readdir, rm } from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";
import { atomicWrite } from "./atomic.js";
import { CpiError } from "./errors.js";
import { loadModules } from "./indexer.js";

const bugRoot = (repo: string) => path.join(repo, ".claude", "bug-knowledge");
const SECRET_PATTERNS = [
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
  /\b(?:AKIA|ASIA)[A-Z0-9]{16}\b/,
  /\b(?:ghp|github_pat)_[A-Za-z0-9_]{20,}\b/,
  /\b(?:password|secret|token)\s*[:=]\s*[^\s]{8,}/i
];

export function normalizeMessage(input: string): string {
  return input
    .replace(/[0-9a-f]{8}-[0-9a-f-]{27,}/gi, "<uuid>")
    .replace(/\b\d{4}-\d{2}-\d{2}T[\d:.+-]+Z?\b/g, "<timestamp>")
    .replace(/(?:[A-Za-z]:\\|\/)[^\s:]+/g, "<path>")
    .replace(/:\d+(?::\d+)?\b/g, ":<line>")
    .replace(/0x[0-9a-f]+/gi, "<address>")
    .replace(/\b\d{5,}\b/g, "<id>")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function fingerprint(kind: string, value: string): string {
  return `${kind}/v1:sha256:${createHash("sha256").update(normalizeMessage(value)).digest("hex")}`;
}

export function assertNoSecrets(text: string): void {
  const matched = SECRET_PATTERNS.find((pattern) => pattern.test(text));
  if (matched) throw new CpiError(`Sensitive information pattern detected: ${matched}`, 4);
}

function parseBug(text: string): { meta: any; body: string } {
  const document = text.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n([\s\S]*)$/);
  if (!document) throw new CpiError("BUG entry must use YAML frontmatter.", 2);
  return { meta: YAML.parse(document[1]), body: document[2] };
}

export async function validateBug(repo: string, file: string): Promise<Record<string, unknown>> {
  const text = await readFile(file, "utf8");
  assertNoSecrets(text);
  const { meta } = parseBug(text);
  const moduleIds = new Set((await loadModules(repo)).map((x) => x.id));
  const errors: string[] = [];
  if (!meta?.id || !/^BUG-[A-Z0-9]+-\d{4,}$/.test(meta.id)) errors.push("$.id must match BUG-<AREA>-<NNNN>");
  if (!["candidate", "verified", "needs-review", "deprecated", "withdrawn", "superseded"].includes(meta?.status)) errors.push("$.status is invalid");
  if (!moduleIds.has(meta?.scope?.primary_module)) errors.push("$.scope.primary_module does not resolve to a module");
  if (meta?.status === "verified") {
    for (const field of ["root_cause.evidence", "verification.regression_tests", "verification.verified_by", "applicability.not_applicable_when"]) {
      const value = field.split(".").reduce((obj, key) => obj?.[key], meta);
      if (!value || (Array.isArray(value) && !value.length)) errors.push(`$.${field} is required for verified status`);
    }
  }
  if (meta?.status === "withdrawn" && !meta?.lifecycle?.withdrawal_reason) errors.push("$.lifecycle.withdrawal_reason is required");
  if (meta?.status === "superseded" && !meta?.lifecycle?.superseded_by) errors.push("$.lifecycle.superseded_by is required");
  return { valid: errors.length === 0, errors, id: meta?.id, status: meta?.status };
}

export async function searchBugs(repo: string, query: string, limit: number): Promise<unknown[]> {
  const roots = ["entries", "candidates", "retired"];
  const normalized = normalizeMessage(query);
  const terms = normalized.split(/\s+/).filter((x) => x.length > 2);
  const results: any[] = [];
  for (const root of roots) {
    const directory = path.join(bugRoot(repo), root);
    for (const name of (await readdir(directory).catch(() => [])).filter((x) => x.endsWith(".md"))) {
      const file = path.join(directory, name);
      const { meta } = parseBug(await readFile(file, "utf8"));
      const haystack = normalizeMessage(JSON.stringify(meta));
      const score = terms.filter((term) => haystack.includes(term)).length;
      if (score) results.push({
        id: meta.id, title: meta.title, status: meta.status,
        primary_module: meta.scope?.primary_module, score,
        not_applicable_when: meta.applicability?.not_applicable_when ?? [],
        path: path.relative(repo, file).replaceAll("\\", "/")
      });
    }
  }
  return results.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id)).slice(0, limit);
}

export async function promoteBug(repo: string, id: string, reviewer: string, confirm: string, dryRun: boolean): Promise<unknown> {
  if (confirm !== id) throw new CpiError("Promotion requires --confirm matching the BUG ID.", 4);
  if (!reviewer.trim()) throw new CpiError("Promotion requires --reviewed-by.", 4);
  const source = path.join(bugRoot(repo), "candidates", `${id}.md`);
  const text = await readFile(source, "utf8");
  const parsed = parseBug(text);
  parsed.meta.status = "verified";
  parsed.meta.verification ??= {};
  parsed.meta.verification.verified_by = reviewer;
  parsed.meta.verification.verified_at = new Date().toISOString();
  const updated = `---\n${YAML.stringify(parsed.meta)}---\n${parsed.body}`;
  assertNoSecrets(updated);
  if (dryRun) return { id, promoted: false, dry_run: true };
  await mkdir(path.join(bugRoot(repo), "entries"), { recursive: true });
  await atomicWrite(repo, path.join(bugRoot(repo), "entries", `${id}.md`), updated);
  await rm(source, { force: true });
  return { id, promoted: true, reviewer };
}

export async function createCandidate(repo: string, sourceFile: string, dryRun: boolean): Promise<unknown> {
  const text = await readFile(sourceFile, "utf8");
  assertNoSecrets(text);
  const parsed = parseBug(text);
  if (!parsed.meta?.id || !/^BUG-[A-Z0-9]+-\d{4,}$/.test(parsed.meta.id)) throw new CpiError("Candidate requires a valid BUG ID.", 2);
  parsed.meta.status = "candidate";
  parsed.meta.lifecycle ??= {};
  parsed.meta.lifecycle.updated_at = new Date().toISOString();
  parsed.meta.lifecycle.created_at ??= parsed.meta.lifecycle.updated_at;
  const output = `---\n${YAML.stringify(parsed.meta)}---\n${parsed.body}`;
  const destination = path.join(bugRoot(repo), "candidates", `${parsed.meta.id}.md`);
  if (!dryRun) {
    await mkdir(path.dirname(destination), { recursive: true });
    await atomicWrite(repo, destination, output);
  }
  return { id: parsed.meta.id, path: path.relative(repo, destination).replaceAll("\\", "/"), created: !dryRun, dry_run: dryRun };
}

export async function retireBug(
  repo: string,
  id: string,
  status: "deprecated" | "withdrawn" | "superseded",
  reason: string,
  replacement: string,
  confirm: string,
  dryRun: boolean
): Promise<unknown> {
  if (confirm !== id || !reason.trim()) throw new CpiError(`Changing ${id} requires --reason and matching --confirm.`, 4);
  const candidates = [path.join(bugRoot(repo), "entries", `${id}.md`), path.join(bugRoot(repo), "candidates", `${id}.md`)];
  let source = "";
  let text = "";
  for (const file of candidates) {
    text = await readFile(file, "utf8").catch(() => "");
    if (text) { source = file; break; }
  }
  if (!source) throw new CpiError(`BUG entry not found: ${id}`, 2);
  const parsed = parseBug(text);
  parsed.meta.status = status;
  parsed.meta.lifecycle ??= {};
  parsed.meta.lifecycle.updated_at = new Date().toISOString();
  parsed.meta.lifecycle[status === "deprecated" ? "deprecated_reason" : status === "withdrawn" ? "withdrawal_reason" : "superseded_by"] =
    status === "superseded" ? replacement : reason;
  if (status === "superseded" && !replacement) throw new CpiError("Superseded BUG requires --replacement.", 2);
  const output = `---\n${YAML.stringify(parsed.meta)}---\n${parsed.body}`;
  const destination = path.join(bugRoot(repo), "retired", `${id}.md`);
  if (!dryRun) {
    await mkdir(path.dirname(destination), { recursive: true });
    await atomicWrite(repo, destination, output);
    await rm(source, { force: true });
  }
  return { id, status, retired: !dryRun, dry_run: dryRun };
}
