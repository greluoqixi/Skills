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

Install directly from the public GitHub marketplace; cloning this repository is
not required. In Claude Code, run:

```text
/plugin marketplace add greluoqixi/Skills
/plugin install claude-project-intelligence@greluoqixi-skills
/reload-plugins
```

This installs at user scope by default, making the plugin available in all of
your projects. To share the plugin enablement with one repository, use the
terminal commands below from that target repository:

```text
claude plugin marketplace add greluoqixi/Skills
claude plugin install claude-project-intelligence@greluoqixi-skills --scope project
```

## Update and uninstall

In Claude Code:

```text
/plugin marketplace update greluoqixi-skills
/reload-plugins
/plugin uninstall claude-project-intelligence@greluoqixi-skills
```

Uninstalling the tool does not delete `.claude/project-knowledge/`, `.claude/bug-knowledge/`, or the managed block in the target repository. Project data deletion is a separate, explicit `cpi knowledge purge` operation.

## Quick start

Open Claude Code in the repository you want to work on, then copy the prompt
that matches your task. Plugin Skills are namespaced, so every prompt below
explicitly selects a Skill from this plugin.

Initialize or refresh project intelligence:

```text
/claude-project-intelligence:project-bootstrap .
```

Find the smallest relevant repository context before implementing a task:

```text
/claude-project-intelligence:project-context Add configurable session expiry without changing the public authentication API. Locate the relevant modules, entrypoints, symbols, tests, rules, and related bug knowledge first.
```

Investigate a defect using reviewed history as hypotheses:

```text
/claude-project-intelligence:fix-with-history Users receive AUTH-401 immediately after refreshing an otherwise valid session. Reproduce the failure, check applicable bug history, verify the current root cause, implement the smallest justified fix, and add regression coverage.
```

Review a candidate BUG record for possible human-confirmed promotion:

```text
/claude-project-intelligence:knowledge-review BUG-AUTH-0001
```

Replace the example task, symptom, or BUG ID with your own. Keep `.` for
bootstrap when Claude Code was opened at the target repository root. The
bootstrap Skill presents semantic Area and Module changes for review before
writing them.

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

- Run `/plugin marketplace update greluoqixi-skills`, then `/reload-plugins`.
- Confirm the plugin is enabled in `/plugin` under the Installed tab.
- Check `node --version` and `claude --version`.
- Run `cpi knowledge doctor --repo . --format json`.
- If an interrupted update is detected, run `cpi index repair --repo .`.
- Network-based repository tests are optional and never required for core validation.

## Documentation

- [Architecture](./docs/architecture.md)
- [Schemas](./docs/schemas.md)
- [Testing](./docs/testing.md)
- [Current version: v0.1.0](./docs/versions/v0.1.0.md)
