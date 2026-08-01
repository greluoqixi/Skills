---
description: Evaluate a job and create grounded Chinese application materials with independent review.
argument-hint: "<job URL, saved job ID, file, or pasted JD>"
---

# /china-job-search:apply

Use the `china-job-search` skill. Follow `references/application.md` exactly and load the evaluation, document, and safety references it names.

Parse `$ARGUMENTS` as a saved job, URL, file, or pasted JD. Run eligibility gates and show the complete fit evaluation. Ask for explicit confirmation before writing materials. If confirmed, choose the appropriate resume, letter/email, platform opener, and form-field outputs. Audit all claims, invoke the `application-reviewer` agent with drafts inline, verify its research, revise, compile with XeLaTeX, inspect the PDFs, run text-layer checks, archive everything, and update tracker.

If any tool is unavailable, report the precise degraded checks. Never claim a PDF or ATS check passed when it was skipped.
