# Testing

Run:

```text
npm ci
npm run validate
claude plugin validate . --strict
```

Core tests are offline and use temporary synthetic repositories. They cover Schema conditions, safe paths, module IDs and routing, manifests, `.gitignore`, BUG frontmatter and lifecycle gates, fingerprints, redaction, configuration, atomic writes, idempotency, Git states, worktrees, concurrency, interruption recovery, existing `CLAUDE.md`, and LSP degradation.

Set `CPI_RUN_GITHUB_TESTS=1` to run shallow, commit-pinned public-repository tests described by `tests/github-repositories.json`. The harness verifies the commit and license metadata and never executes cloned code, package installation, hooks, or submodules. Network failures are reported as skipped.

Performance fixtures define small as 5,000 effective files and medium as 50,000. Targets are under 5s and 30s respectively, under 2s for a 100-file reconciliation, byte-identical no-change rebuilds, 100% exact add/delete/rename fixture accuracy, and consistent output after eight concurrent workers. Record hardware and actual results when publishing a release.

To reproduce a failure, preserve the generated fixture seed, CLI arguments, Node/Claude versions, platform, exit code, structured stderr, and manifest hashes. Never attach sensitive source contents.
