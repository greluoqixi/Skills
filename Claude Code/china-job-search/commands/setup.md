---
description: Initialize or refresh a local Mainland China job-search workspace.
argument-hint: "[workspace path]"
---

# /china-job-search:setup

Use the `china-job-search` skill. Read `references/workspace.md` and `references/safety.md`.

Resolve `$ARGUMENTS` as the workspace path; default to `./job-search-cn`. Run the workspace initializer, then offer exactly three onboarding paths: import a user-provided material directory, import one existing CV, or conduct a structured interview. Populate candidate facts and preferences with source notes. Keep sensitive optional fields in `profile/private.md`; do not request them unless the chosen track or a real posting requires them.

Finish by summarizing missing high-value facts, selected tracks, target roles/cities, and the next recommended command. Never overwrite existing personalized files.
