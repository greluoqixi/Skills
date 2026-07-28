import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";
import { atomicWrite } from "./atomic.js";
import { defaultConfig } from "./config.js";
import { reconcile } from "./indexer.js";
import { validateSchema } from "./schemas.js";

const MANAGED_START = "<!-- claude-project-intelligence:start -->";
const MANAGED_END = "<!-- claude-project-intelligence:end -->";

const managedBlock = `${MANAGED_START}
## Project intelligence protocol

- Route code tasks with \`cpi index search --repo . --query "<task>"\` before broad exploration.
- Read only the most relevant module cards under \`.claude/project-knowledge/modules/\`.
- Prefer LSP for definitions, references, implementations, diagnostics, and symbol details.
- For broad exploration, use the \`codebase-navigator\` subagent and return a concise summary.
- Before fixing a bug, run \`cpi bug search --repo . --query "<error and symptom>"\`.
- Historical fixes are hypotheses: reproduce and verify; never copy an old patch blindly.
- New bug knowledge starts as candidate and requires human review before promotion.
- Run \`cpi index verify --repo .\`; use \`reconcile\`, \`repair\`, or \`rebuild\` for drift.
- Do not hand-edit generated JSONL manifests or generated indexes.
${MANAGED_END}`;

function mergeClaudeMd(existing: string): string {
  const start = existing.indexOf(MANAGED_START);
  const end = existing.indexOf(MANAGED_END);
  if (start >= 0 && end >= start) {
    return existing.slice(0, start) + managedBlock + existing.slice(end + MANAGED_END.length);
  }
  return `${existing.trimEnd()}${existing.trim() ? "\n\n" : ""}${managedBlock}\n`;
}

export async function bootstrap(repo: string, dryRun: boolean): Promise<Record<string, unknown>> {
  const directories = [
    ".claude/project-knowledge/areas", ".claude/project-knowledge/modules",
    ".claude/project-knowledge/guidance", ".claude/project-knowledge/candidates/modules",
    ".claude/project-knowledge/manifests", ".claude/project-knowledge/schemas",
    ".claude/bug-knowledge/entries", ".claude/bug-knowledge/candidates",
    ".claude/bug-knowledge/retired", ".claude/bug-knowledge/indexes/by-module",
    ".claude/bug-knowledge/indexes/by-error-code", ".claude/bug-knowledge/indexes/by-root-cause",
    ".claude/bug-knowledge/manifests", ".claude/bug-knowledge/schemas",
    ".claude/rules"
  ];
  if (!dryRun) for (const directory of directories) await mkdir(path.join(repo, directory), { recursive: true });

  const initialIndex = {
    schema_version: "1.0", project: { name: path.basename(repo), summary: "Review and replace this candidate summary." },
    areas: [], cross_module_rules: [], excludes: defaultConfig.exclude,
    freshness: { generator_version: "0.1.0", updated_at: new Date().toISOString() }
  };
  validateSchema("config", defaultConfig);
  validateSchema("project-index", initialIndex);
  const files: Array<[string, string]> = [
    [".claude/project-intelligence.yaml", YAML.stringify(defaultConfig)],
    [".claude/project-knowledge/project-index.yaml", YAML.stringify(initialIndex)],
    [".claude/project-knowledge/INDEX.md", "# Project Knowledge\n\nUse `project-index.yaml` for routing, then read only the selected area and module cards.\n"],
    [".claude/bug-knowledge/INDEX.md", "# Bug Knowledge\n\nUse `cpi bug search`; do not load this directory wholesale.\n"],
    [".claude/rules/project-intelligence-navigation.md", "# Project intelligence\n\nUse the root navigation and bug protocols in `CLAUDE.md`; load module and bug records only when relevant.\n"]
  ];
  const changed: string[] = [];
  for (const [relative, content] of files) {
    const target = path.join(repo, relative);
    const exists = await readFile(target, "utf8").catch(() => null);
    if (exists === null) {
      changed.push(relative);
      if (!dryRun) await atomicWrite(repo, target, content);
    }
  }
  const claudePath = path.join(repo, "CLAUDE.md");
  const existing = await readFile(claudePath, "utf8").catch(() => "");
  const merged = mergeClaudeMd(existing);
  if (merged !== existing) {
    changed.push("CLAUDE.md");
    if (!dryRun) await atomicWrite(repo, claudePath, merged);
  }
  const index = await reconcile(repo, dryRun);
  return { initialized: !dryRun, dry_run: dryRun, changed, index };
}
