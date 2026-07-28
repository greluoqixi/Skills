---
name: knowledge-review
description: Review candidate project modules or bug knowledge, enforce verified-entry admission rules, and manage needs-review, deprecated, withdrawn, or superseded lifecycle states. Use only when a user explicitly requests knowledge review or promotion.
disable-model-invocation: true
argument-hint: "<candidate path or BUG ID>"
---

# Review project knowledge

1. Run the relevant Schema validation and `cpi knowledge doctor --repo .`.
2. Use the `bug-librarian` agent for read-only evidence and duplicate review.
3. For a BUG candidate, require reproduction or equivalent evidence, supported root cause, before/after comparison, regression coverage or exception, relevant tests, applicability, exclusions, commit/PR/issue evidence, duplicate review, sensitive-data review, and human or formal code-review confirmation.
4. If any gate is missing, leave the entry as `candidate` or mark it `needs-review`; list exact missing fields.
5. Show the final diff and request explicit confirmation of the BUG ID and reviewer identity.
6. Promote only with `cpi bug promote --repo . --id <ID> --reviewed-by <IDENTITY> --confirm <ID>`.
7. Preserve retired knowledge. Record reasons and relations for deprecated, withdrawn, and superseded states; do not delete records.

CI may validate candidates but must not promote them.
