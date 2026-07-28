[中文](./README.zh-CN.md)

# Skills

A public collection of self-built Skills, Plugins, and supporting tools for
AI coding agents.

Each agent ecosystem is kept in a separate top-level directory so that its
formats, installation methods, and compatibility requirements remain clear.
Claude Code and Codex are the first supported ecosystems; more agents may be
added over time.

## Repository layout

| Directory | Purpose |
| --- | --- |
| [`Claude Code/`](./Claude%20Code/README.md) | Claude Code Skills and installable Plugins. |
| [`Codex/`](./Codex/) | Codex Skills and Plugins. |

## Supported agents and projects

### Claude Code

- [`claude-project-intelligence`](./Claude%20Code/claude-project-intelligence/README.md)
  — Project navigation, deterministic indexing, and verified bug knowledge
  support for large repositories.

See the [Claude Code collection README](./Claude%20Code/README.md) for
Claude Code-specific compatibility and project navigation.

### Codex

No public projects have been added yet.

## Contributing

- Keep Claude Code and Codex extensions in their respective directories.
- Give each project its own README, license information, compatibility notes,
  tests, and installation instructions.
- Do not commit credentials, private project knowledge, generated dependency
  directories, or test repositories.
- Validate and test an extension with the product and runtime versions claimed
  by its documentation.

When adding support for another agent, create a dedicated top-level directory
and a concise bilingual collection README. Unless a project states otherwise,
compatibility and licensing are documented at the project level.
