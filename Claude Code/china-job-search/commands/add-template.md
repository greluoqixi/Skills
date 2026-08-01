---
description: Register and validate a custom resume or cover-letter template.
argument-hint: "<template path>"
---

# /china-job-search:add-template

Use the `china-job-search` skill and read `references/documents.md` and `references/safety.md`.

Inspect `$ARGUMENTS`, identify source extension, compile command, fonts, placeholders, page target, ATS risks, and output path. Copy only files required by the template into the workspace templates directory after confirmation. Replace personal data with placeholders, test compile, inspect page count and text extraction, then record a small manifest. Reject templates that require unknown install scripts or cannot produce a readable text layer unless the user explicitly accepts the ATS tradeoff.
