# Schemas

All schemas use JSON Schema Draft 2020-12, version `1.0`, closed objects by default, and an optional `extensions` object.

- `project-index`: stable project purpose and Area routes, never a complete tree.
- `area`: semantic responsibility, routing terms, Modules, and shared dependencies.
- `module`: stable ID, responsibility boundaries, selected files/interfaces/tests, relations, rules, and freshness.
- `file-manifest`: one schema-valid JSONL record per safe repository-relative file.
- `module-manifest`: generated module counts and structure hashes.
- `state`: generator, Git, manifest hash, and reconciliation state.
- `verified-bug`: all BUG lifecycle states with conditional verified/retired requirements.

Repository-relative paths cannot be absolute or contain `..`, drive prefixes, backslashes, or NUL. Module IDs are lowercase dot-separated semantic segments. JSON Schema validates individual documents; `knowledge doctor` resolves modules, file existence, cross-record relations, and lifecycle references.

Module split/merge thresholds are defaults, not automatic truth. A split is suggested around 200–300 effective files, more than 15 key files, independent interfaces/tests/owners, or an incoherent summary. Small implementation-only groups are merged. Semantic changes always produce review candidates.

Verified BUG admission requires evidence, before/after verification, regression coverage or an exception, applicability and exclusions, repository evidence, duplicate and sensitive-data review, and human/formal approval. Migrations are explicit, dry-runnable, journaled, and never silently rewrite curated fields.
