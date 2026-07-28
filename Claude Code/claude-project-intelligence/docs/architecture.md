# Architecture

## Boundaries

The plugin packages four on-demand Skills, two read-only Subagents, lifecycle Hooks, one deterministic CLI, JSON Schemas, and templates. A single Skill would either load too much procedure into context or rely on the model to maintain mutable facts.

The Project Index routes `Repository -> Area -> Module`. JSONL maps modules to files. LSP maps files to symbols. The bug library is separate and is queried only after module routing.

## Project knowledge flow

`bootstrap` inventories safe files, then a read-only navigator proposes semantic modules. Review precedes applying semantic cards. Hooks mark a bootstrapped repository dirty; Stop or SessionEnd compares the current Git/filesystem state with the manifest and atomically updates generated facts. Ordinary content changes update hashes only. Boundary changes create review candidates.

## Bug knowledge flow

A defect workflow normalizes stable signatures, searches a bounded manifest, rejects explicit non-applicability, and reads at most two entries. Fixes are independently reproduced. New lessons are candidates. A separate human-triggered review validates evidence and promotion gates.

## Context budgets

Root index: 10KB/200 lines. Module card: 8KB/160 lines. Module candidates: at most five; cards: at most two. Project-context output: 16,000 characters. BUG summaries: five/4,000 characters; full BUG records: two/16,000 characters.

## Safety and recovery

All writes are canonical-root checked. Hooks use exec-form arguments. Sensitive and binary files are excluded. Generated files use same-directory temporary files and rename. Runtime dirty markers live in plugin data, not the repository. Verify is read-only; repair rebuilds only generated artifacts. Semantic changes and verified promotion remain human boundaries.
