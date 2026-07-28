import { createHash } from "node:crypto";
import { lstat, opendir, readFile } from "node:fs/promises";
import path from "node:path";
import ignore from "ignore";
import type { FileRecord } from "./types.js";
import type { ProjectConfig } from "./config.js";
import { normalizeRepoRelative } from "./paths.js";

const DEFAULT_EXCLUDES = [
  ".git", ".hg", ".svn", "node_modules", "vendor", "dist", "build", "target",
  ".cache", ".venv", "venv", "__pycache__", ".next", "coverage", ".claude/project-knowledge",
  ".claude/bug-knowledge"
];
const SENSITIVE = [
  /(?:^|\/)\.env(?:\.|$)/i, /(?:^|\/)id_(?:rsa|dsa|ecdsa|ed25519)$/i,
  /\.(?:pem|p12|pfx|key)$/i, /(?:credentials|secrets?)\.(?:json|ya?ml|toml)$/i
];

const languageByExtension: Record<string, string> = {
  ".ts": "typescript", ".tsx": "typescript", ".js": "javascript", ".jsx": "javascript",
  ".py": "python", ".go": "go", ".rs": "rust", ".java": "java", ".kt": "kotlin",
  ".c": "c", ".h": "c", ".cpp": "cpp", ".hpp": "cpp", ".cs": "csharp",
  ".rb": "ruby", ".php": "php", ".swift": "swift", ".scala": "scala",
  ".yaml": "yaml", ".yml": "yaml", ".json": "json", ".toml": "toml", ".md": "markdown"
};

function roleFor(relative: string): FileRecord["role"] {
  const lower = relative.toLowerCase();
  if (/(^|\/)(test|tests|spec|specs)\//.test(lower) || /\.(test|spec)\.[^.]+$/.test(lower)) return "test";
  if (/(^|\/)(main|index|app|server|cli)\.[^.]+$/.test(lower)) return "entrypoint";
  if (/(model|entity|domain)/.test(lower)) return "domain-model";
  if (/(adapter|gateway|client|repository)/.test(lower)) return "adapter";
  if (/(config|settings|manifest)/.test(lower)) return "config";
  return "other";
}

function looksBinary(buffer: Buffer): boolean {
  return buffer.subarray(0, Math.min(buffer.length, 8192)).includes(0);
}

export async function scanRepository(repo: string, config: ProjectConfig): Promise<FileRecord[]> {
  const matcher = ignore().add(DEFAULT_EXCLUDES.flatMap((x) => [x, `${x}/**`])).add(config.exclude);
  const gitignore = await readFile(path.join(repo, ".gitignore"), "utf8").catch(() => "");
  if (gitignore) matcher.add(gitignore);
  const records: FileRecord[] = [];

  async function walk(directory: string): Promise<void> {
    const dir = await opendir(directory);
    for await (const entry of dir) {
      const absolute = path.join(directory, entry.name);
      const relative = normalizeRepoRelative(path.relative(repo, absolute));
      if (matcher.ignores(relative) || SENSITIVE.some((pattern) => pattern.test(relative))) continue;
      const stat = await lstat(absolute);
      if (stat.isSymbolicLink()) {
        records.push({
          path: relative, module: "unassigned", role: "other", language: "symlink",
          generated: false, size: stat.size, hash: "sha256:symlink", mode: "symlink"
        });
      } else if (stat.isDirectory()) {
        await walk(absolute);
      } else if (stat.isFile() && stat.size <= config.limits.max_file_bytes) {
        const content = await readFile(absolute);
        if (looksBinary(content)) continue;
        records.push({
          path: relative,
          module: "unassigned",
          role: roleFor(relative),
          language: languageByExtension[path.extname(relative).toLowerCase()] ?? "other",
          generated: /(^|\/)(generated|gen|dist|build)\//i.test(relative),
          size: stat.size,
          hash: `sha256:${createHash("sha256").update(content).digest("hex")}`,
          mode: "file"
        });
      }
    }
  }
  await walk(repo);
  return records.sort((a, b) => a.path.localeCompare(b.path));
}
