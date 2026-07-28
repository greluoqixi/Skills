---
name: fix-with-history
description: Investigate and fix a reproducible bug using reviewed historical bug knowledge as bounded candidate evidence. Use for errors, regressions, crashes, incorrect behavior, or failing tests where prior fixes may help.
argument-hint: "<error, symptom, or failing test>"
---

# Fix with reviewed history

1. Route the task to a stable module ID before searching BUG knowledge.
2. Extract error codes, normalized messages, the top three stable stack functions, behavioral symptoms, runtime, version, conditions, and exclusions.
3. Run `cpi bug search --repo . --query "$ARGUMENTS" --limit 5 --format json`.
4. Exclude candidates whose `not_applicable_when` matches. Load no more than two complete entries.
5. State each surviving old fix as a hypothesis. Reproduce the current failure and independently confirm the root cause; never copy an old patch without verification.
6. Implement the smallest justified change only after evidence supports it. Do not let the CLI execute unknown repository tests; run only commands the user or repository documentation authorizes.
7. Compare before/after behavior and add regression coverage or record a justified exception.
8. Prepare a redacted candidate BUG entry. New records must remain `candidate`; never promote automatically.

Do not include raw credentials, customer data, complete logs, absolute paths, request IDs, random tokens, or unstable line numbers.
