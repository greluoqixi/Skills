[中文](./README.zh-CN.md)

# Skills

A public collection of self-built Skills, Plugins, and supporting tools for
AI coding agents.

Each agent ecosystem is kept in a separate top-level directory so that its
formats, installation methods, and compatibility requirements remain clear.
Claude Code, Codex, and DeepSeek Harness are currently supported; more agents
may be added over time.

## Repository layout

| Directory | Purpose |
| --- | --- |
| [`Claude Code/`](./Claude%20Code/README.md) | Claude Code Skills and installable Plugins. |
| [`Codex/`](./Codex/) | Codex Skills and Plugins. |
| [`DeepSeek Harness/`](./DeepSeek%20Harness/README.md) | DeepSeek Harness (DSH) client and host Plugins. |

## Supported agents and projects

### Claude Code

- [`claude-project-intelligence`](./Claude%20Code/claude-project-intelligence/README.md)
  — Project navigation, deterministic indexing, and verified bug knowledge
  support for large repositories.
- [`china-job-search`](./Claude%20Code/china-job-search/README.md)
  — Local-first job search, application, interview, and outcome workflows
  adapted for Mainland China.

See the [Claude Code collection README](./Claude%20Code/README.md) for
Claude Code-specific compatibility and project navigation.

### Codex

No public projects have been added yet.

### DeepSeek Harness

- [`dsh-client-ui-usage`](./DeepSeek%20Harness/plugins/dsh-client-ui-usage/README.md)
  — Live context-window occupancy meter and per-model (pro/flash) billing
  estimate in the DSH web session header, with a click-open breakdown panel,
  an official rate card, and a peak/off-peak indicator.

See the [DeepSeek Harness collection README](./DeepSeek%20Harness/README.md)
for DeepSeek Harness-specific plugin layout, installation, and compatibility.

## Contributing

- Keep Claude Code, Codex, and DeepSeek Harness extensions in their respective
  directories.
- Give each project its own README, license information, compatibility notes,
  tests, and installation instructions.
- Do not commit credentials, private project knowledge, generated dependency
  directories, or test repositories.
- Validate and test an extension with the product and runtime versions claimed
  by its documentation.

When adding support for another agent, create a dedicated top-level directory
and a concise bilingual collection README. Unless a project states otherwise,
compatibility and licensing are documented at the project level.
