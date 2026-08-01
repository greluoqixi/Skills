---
description: Generate an offline HTML dashboard for the local application pipeline.
argument-hint: "[workspace path]"
---

# /china-job-search:report

Use the `china-job-search` skill and read `references/tracking.md`.

Resolve the workspace from `$ARGUMENTS` or the current directory. Run `scripts/report.py` against `tracker.csv`, writing a dated file under `reports/`. Confirm counts and output path. The report must be self-contained and must not embed document bodies, sensitive profile values, remote scripts, analytics, or external assets.
