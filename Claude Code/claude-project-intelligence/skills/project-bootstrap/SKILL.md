---
name: project-bootstrap
description: Initialize or refresh semantic project intelligence for a repository. Use when a user explicitly asks to bootstrap, initialize, or rebuild project knowledge. Preserve existing CLAUDE.md content and reviewed module knowledge.
disable-model-invocation: true
argument-hint: "[repository path]"
---

# Bootstrap project intelligence

1. Confirm the repository root and run `cpi bootstrap --repo "$ARGUMENTS" --dry-run --format json`.
2. Inspect existing `CLAUDE.md`, `.claude/`, build manifests, test configuration, ownership boundaries, and the dry-run diff.
3. Create a semantic Area/Module proposal. Do not mirror directory depth. Treat technical folders such as controllers, services, models, DTOs, helpers, utilities, constants, and repositories as implementation details unless they have an independent interface, test, build, deployment, or ownership boundary.
4. Use the `codebase-navigator` agent for broad exploration. Keep its result to candidate module IDs, paths, responsibilities, key interfaces, tests, and evidence.
5. Present module IDs and all semantic changes for review. Preserve established IDs across directory renames.
6. After explicit approval, run `cpi bootstrap --repo "$ARGUMENTS"` and write reviewed module cards. Do not overwrite responsibilities, rules, risks, or guidance that the user already maintains.
7. Finish with `cpi index verify --repo "$ARGUMENTS"` and `cpi knowledge doctor --repo "$ARGUMENTS"`.

Never execute unknown repository scripts. Never write outside the selected repository's root `CLAUDE.md` and `.claude/` knowledge paths.
