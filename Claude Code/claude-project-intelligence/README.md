[中文](./README.zh-CN.md)

# Claude Project Intelligence

An installable Claude Code plugin for semantic repository navigation, deterministic file indexing, and reviewed bug knowledge. It complements `/init`: `/init` creates general project instructions, while this plugin maintains bounded, queryable knowledge for large and changing repositories.

## Components

- `project-bootstrap` initializes a short `CLAUDE.md` protocol, semantic Project Index, manifests, and bug library.
- `project-context` routes tasks to at most five modules and delegates broad exploration to an isolated subagent.
- `fix-with-history` treats previous fixes as hypotheses and creates candidates only.
- `knowledge-review` enforces human-confirmed promotion and lifecycle rules.
- Hooks mark initialized repositories dirty and reconcile deterministic manifests at turn/session boundaries.
- The `cpi` CLI owns scanning, verification, repair, search, safety checks, and migrations.
- Claude Code's LSP tool owns symbol definitions and references; this plugin does not rebuild a call graph.

## Supported repositories and requirements

The scanner is language-neutral and supports monoliths, monorepos, and mixed-language repositories on macOS and Linux. Windows 11 support is preview.

- Claude Code 2.1.218 or newer; tested release target: 2.1.220
- Node.js 20 or newer
- Git is recommended but not required
- No database, cloud service, vector store, or target-project dependency installation

## Install

From the directory containing `Claude Code/`:

```text
claude plugin marketplace add "./Claude Code"
claude plugin install claude-project-intelligence@claude-code-project-tools --scope project
```

Run `/reload-plugins` in an existing Claude Code session. For development without installing:

```text
claude --plugin-dir "./Claude Code/claude-project-intelligence"
```

## Update and uninstall

```text
claude plugin marketplace update claude-code-project-tools
claude plugin update claude-project-intelligence@claude-code-project-tools --scope project
claude plugin uninstall claude-project-intelligence@claude-code-project-tools --scope project
```

Uninstalling the tool does not delete `.claude/project-knowledge/`, `.claude/bug-knowledge/`, or the managed block in the target repository. Project data deletion is a separate, explicit `cpi knowledge purge` operation.

## Quick start

1. Open Claude Code in the target repository.
2. Run `/claude-project-intelligence:project-bootstrap .`.
3. Review the proposed semantic Areas and Modules before applying.
4. Route work with `/claude-project-intelligence:project-context <task>`.
5. For defects, use `/claude-project-intelligence:fix-with-history <symptom>`.

The bootstrap creates `.claude/project-intelligence.yaml`, project and bug knowledge directories, a concise navigation rule, and a managed block in `CLAUDE.md`. Existing content is preserved.

## Working with the index

```text
cpi index search --repo . --query "authentication session expiry"
cpi index verify --repo .
cpi index reconcile --repo .
cpi index repair --repo .
cpi index rebuild --repo .
```

The root index is a router, not a file tree. Module cards describe semantic responsibilities and contain only a few key files. The complete file list stays in JSONL and is queried by the CLI.

## Bug knowledge

Search returns no more than five summaries. Workflows read at most two complete entries. `candidate` means a proposed lesson; `verified` additionally requires evidence, regression coverage or an exception, applicability boundaries, a repository reference, sensitive-data review, and human/formal review.

```text
cpi bug search --repo . --query "AUTH-401 expired session"
cpi bug validate --repo . --file .claude/bug-knowledge/candidates/BUG-AUTH-0001.md
cpi bug promote --repo . --id BUG-AUTH-0001 --reviewed-by alice --confirm BUG-AUTH-0001
```

## Safety and limitations

The CLI writes only the target repository's root `CLAUDE.md` and `.claude/` knowledge paths. It rejects path traversal, does not follow directory symlinks, skips common secret files and large/binary files, and never executes target repository scripts. Hooks have the user's local permissions; inspect them before enabling the plugin.

Semantic module discovery remains review-based. Rename similarity can be uncertain. LSP quality depends on installed language servers. v0.1.0 does not provide AST call graphs, embeddings, vector search, a database, cloud sync, or automatic bug promotion.

## Troubleshooting

- Run `claude plugin validate ./Claude Code/claude-project-intelligence --strict`.
- Check `node --version` and `claude --version`.
- Run `cpi knowledge doctor --repo . --format json`.
- If an interrupted update is detected, run `cpi index repair --repo .`.
- Network-based repository tests are optional and never required for core validation.

## Documentation

- [Architecture](./docs/architecture.md)
- [Schemas](./docs/schemas.md)
- [Testing](./docs/testing.md)
- [Current version: v0.1.0](./docs/versions/v0.1.0.md)
