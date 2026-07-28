import { readFile, rm } from "node:fs/promises";
import path from "node:path";
import { bootstrap } from "./bootstrap.js";
import { createCandidate, promoteBug, retireBug, searchBugs, validateBug } from "./bugs.js";
import { CpiError } from "./errors.js";
import { reconcile, searchModules, verifyIndex } from "./indexer.js";
import { canonicalRepo } from "./paths.js";
import { checkStale, markDirty, reconcileIfDirty } from "./hooks.js";

interface Parsed {
  positionals: string[];
  options: Map<string, string | boolean>;
}

function parse(argv: string[]): Parsed {
  const positionals: string[] = [];
  const options = new Map<string, string | boolean>();
  for (let i = 0; i < argv.length; i++) {
    const value = argv[i];
    if (!value.startsWith("--")) positionals.push(value);
    else {
      const key = value.slice(2);
      const next = argv[i + 1];
      if (next && !next.startsWith("--")) {
        options.set(key, next);
        i++;
      } else options.set(key, true);
    }
  }
  return { positionals, options };
}

const HELP = `claude-project-intelligence (cpi)

Usage:
  cpi bootstrap [--repo PATH] [--dry-run] [--format json]
  cpi index build|reconcile|verify|repair|rebuild [--repo PATH]
  cpi index search --query TEXT [--limit 1..5] [--repo PATH]
  cpi bug search --query TEXT [--limit 1..5] [--repo PATH]
  cpi bug validate --file PATH [--repo PATH]
  cpi bug candidate create --file PATH [--repo PATH]
  cpi bug promote --id ID --reviewed-by NAME --confirm ID [--dry-run]
  cpi bug deprecate|withdraw|supersede --id ID --reason TEXT --confirm ID
  cpi knowledge doctor [--repo PATH]
  cpi knowledge migrate|rollback|purge [--repo PATH] [--dry-run]
  cpi hook mark-dirty|reconcile|check-stale [--repo PATH]

All mutating commands support --dry-run. Structured output uses --format json.
`;

function option(parsed: Parsed, name: string, fallback = ""): string {
  const value = parsed.options.get(name);
  return typeof value === "string" ? value : fallback;
}

function print(result: unknown, json: boolean): void {
  if (json) console.log(JSON.stringify(result, null, 2));
  else console.log(typeof result === "string" ? result : JSON.stringify(result, null, 2));
}

async function main(): Promise<void> {
  const parsed = parse(process.argv.slice(2));
  if (!parsed.positionals.length || parsed.options.has("help")) {
    console.log(HELP);
    return;
  }
  const repo = await canonicalRepo(option(parsed, "repo", process.cwd()));
  const [group, action] = parsed.positionals;
  const dryRun = parsed.options.has("dry-run");
  const json = option(parsed, "format") === "json";
  let result: unknown;

  if (group === "hook" && action === "mark-dirty") result = await markDirty(repo);
  else if (group === "hook" && action === "reconcile") result = await reconcileIfDirty(repo);
  else if (group === "hook" && action === "check-stale") result = await checkStale(repo);
  else if (group === "bootstrap") result = await bootstrap(repo, dryRun);
  else if (group === "index" && ["build", "reconcile", "repair", "rebuild"].includes(action)) result = await reconcile(repo, dryRun);
  else if (group === "index" && action === "verify") result = await verifyIndex(repo);
  else if (group === "index" && action === "search") {
    const limit = Math.min(5, Math.max(1, Number(option(parsed, "limit", "5"))));
    result = await searchModules(repo, option(parsed, "query"), limit);
  } else if (group === "bug" && action === "search") {
    const limit = Math.min(5, Math.max(1, Number(option(parsed, "limit", "5"))));
    result = await searchBugs(repo, option(parsed, "query"), limit);
  } else if (group === "bug" && action === "validate") {
    result = await validateBug(repo, path.resolve(repo, option(parsed, "file")));
  } else if (group === "bug" && action === "candidate" && parsed.positionals[2] === "create") {
    result = await createCandidate(repo, path.resolve(repo, option(parsed, "file")), dryRun);
  } else if (group === "bug" && action === "promote") {
    if (parsed.options.has("ci")) throw new CpiError("BUG promotion is disabled in CI mode.", 4);
    result = await promoteBug(repo, option(parsed, "id"), option(parsed, "reviewed-by"), option(parsed, "confirm"), dryRun);
  } else if (group === "bug" && ["deprecate", "withdraw", "supersede"].includes(action)) {
    const status = action === "deprecate" ? "deprecated" : action === "withdraw" ? "withdrawn" : "superseded";
    result = await retireBug(repo, option(parsed, "id"), status, option(parsed, "reason"), option(parsed, "replacement"), option(parsed, "confirm"), dryRun);
  } else if (group === "knowledge" && action === "doctor") {
    const index = await verifyIndex(repo);
    const state = await readFile(path.join(repo, ".claude/project-knowledge/manifests/state.json"), "utf8").catch(() => "");
    result = { healthy: Boolean((index as any).valid), index, state: state ? JSON.parse(state) : null };
  } else if (group === "knowledge" && action === "migrate") {
    result = { from: "1.0", to: "1.0", changes: [], applied: false, dry_run: dryRun, message: "No migration is required." };
  } else if (group === "knowledge" && action === "rollback") {
    result = { rolled_back: false, message: "No applied migration journal was found." };
  } else if (group === "knowledge" && action === "purge") {
    const expected = path.basename(repo);
    if (option(parsed, "confirm") !== expected) throw new CpiError(`Purge requires --confirm ${expected}`, 4);
    const targets = [path.join(repo, ".claude", "project-knowledge"), path.join(repo, ".claude", "bug-knowledge")];
    if (!dryRun) for (const target of targets) await rm(target, { recursive: true, force: true });
    result = { targets: targets.map((x) => path.relative(repo, x)), purged: !dryRun, dry_run: dryRun };
  } else throw new CpiError(`Unknown command: ${parsed.positionals.join(" ")}`, 2);
  print(result, json);
}

main().catch((error: unknown) => {
  const handled = error instanceof CpiError ? error : new CpiError(error instanceof Error ? error.message : String(error));
  console.error(JSON.stringify({ error: handled.message, details: handled.details }, null, 2));
  process.exitCode = handled.exitCode;
});
