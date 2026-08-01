---
description: Search and deduplicate Mainland China enterprise, campus, internship, or SOE jobs.
argument-hint: "[keywords, city, or track]"
---

# /china-job-search:search

Use the `china-job-search` skill. Read `references/platforms.md`, `references/evaluation.md`, and the workspace profile/preferences.

Build track-specific Chinese queries from `$ARGUMENTS` and the profile. Use public web search and sources whose access rules permit it. For commercial sites, generate search links or consume user-provided URLs/text; do not bypass login or verification. Normalize every observed job and pass JSON records through `job_store.py`, then exclude entries already in tracker.

Present new jobs sorted high/medium/low quick fit, with source, city, deadline, qualifications, access limitations, and manual next step. Generate channel-appropriate contact drafts only for high/medium fits, never send them. Suggest `rank` when roughly eight or more jobs remain.
