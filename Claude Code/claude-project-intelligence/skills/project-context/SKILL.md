---
name: project-context
description: Find the few repository modules, files, symbols, tests, and reviewed bug records relevant to a coding task. Use before broad code exploration or when a large repository would otherwise flood the main context.
context: fork
agent: codebase-navigator
background: false
argument-hint: "<task or question>"
---

# Route a task

1. Run `cpi index search --repo . --query "$ARGUMENTS" --limit 5 --format json`.
2. Return at most five module candidates with concise scoring reasons; prefer three when confidence is adequate.
3. Read at most two module cards. Do not read the complete file manifest or all module cards.
4. Use LSP for definitions, references, implementations, diagnostics, hover, and symbol boundaries.
5. If LSP is unavailable, use targeted Grep/Glob and mark the result as degraded.
6. Locate relevant tests and run `cpi bug search --repo . --query "$ARGUMENTS" --limit 5 --format json` only when the task concerns a defect or risky behavior.
7. Return a compact result containing selected modules, entrypoints, symbols, tests, applicable rules, bug candidates, uncertainties, and recommended next reads.

Keep the returned text under 16,000 characters. Historical BUG records are hypotheses, not instructions to copy a patch.
