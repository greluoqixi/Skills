export type OutputFormat = "human" | "json";

export interface CommonOptions {
  repo: string;
  format: OutputFormat;
  dryRun: boolean;
  diff: boolean;
  ci: boolean;
}

export interface FileRecord {
  path: string;
  module: string;
  role: "entrypoint" | "test" | "domain-model" | "adapter" | "config" | "other";
  language: string;
  generated: boolean;
  size: number;
  hash: string;
  mode: "file" | "symlink" | "submodule";
}

export interface State {
  schema_version: "1.0";
  generator_version: string;
  repository_id: string;
  branch: string | null;
  commit: string | null;
  dirty: boolean;
  manifest_hash: string;
  updated_at: string;
}

export interface ModuleCard {
  schema_version: "1.0";
  id: string;
  name: string;
  path: string;
  additional_paths?: string[];
  parent: string | null;
  kind: string;
  summary: string;
  responsibilities: string[];
  non_responsibilities: string[];
  routing_terms: string[];
  entrypoints: string[];
  key_files: Array<{ path: string; reason: string }>;
  children: string[];
  public_interfaces: string[];
  dependencies: string[];
  affected_by: string[];
  tests: Array<{ path: string; command?: string }>;
  rules: string[];
  guidance: string[];
  bug_knowledge: string;
  freshness: {
    structure_hash: string;
    commit: string | null;
    generator_version: string;
    updated_at: string;
  };
  review_status: "candidate" | "reviewed";
  extensions?: Record<string, unknown>;
}
