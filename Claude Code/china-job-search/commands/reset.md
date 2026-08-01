---
description: Safely reset selected local job-search data after explicit confirmation.
argument-hint: "<profile | search | applications | all>"
---

# /china-job-search:reset

Use the `china-job-search` skill and read `references/workspace.md`.

Resolve the workspace and `$ARGUMENTS`. Enumerate exact affected paths, exclude templates/framework files, and show whether each target is recoverable. Require the user to type `RESET <scope>` exactly before deletion. Never use a broad recursive target, environment-variable-only path, workspace root, home directory, or plugin installation directory.
