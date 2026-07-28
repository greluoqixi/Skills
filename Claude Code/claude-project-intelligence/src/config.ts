import { readFile } from "node:fs/promises";
import path from "node:path";
import YAML from "yaml";

export interface ProjectConfig {
  schema_version: "1.0";
  exclude: string[];
  limits: {
    max_file_bytes: number;
    root_index_bytes: number;
    root_index_lines: number;
    module_card_bytes: number;
    module_candidate_limit: number;
    bug_candidate_limit: number;
    bug_full_read_limit: number;
  };
  modules: {
    target_min_files: number;
    target_max_files: number;
    split_file_threshold: number;
    max_key_files: number;
    max_children: number;
  };
}

export const defaultConfig: ProjectConfig = {
  schema_version: "1.0",
  exclude: [],
  limits: {
    max_file_bytes: 2_000_000,
    root_index_bytes: 10_000,
    root_index_lines: 200,
    module_card_bytes: 8_000,
    module_candidate_limit: 5,
    bug_candidate_limit: 5,
    bug_full_read_limit: 2
  },
  modules: {
    target_min_files: 20,
    target_max_files: 200,
    split_file_threshold: 300,
    max_key_files: 15,
    max_children: 10
  }
};

export async function loadConfig(repo: string): Promise<ProjectConfig> {
  const configPath = path.join(repo, ".claude", "project-intelligence.yaml");
  const text = await readFile(configPath, "utf8").catch(() => "");
  if (!text) return structuredClone(defaultConfig);
  const parsed = YAML.parse(text) as Partial<ProjectConfig>;
  return {
    ...defaultConfig,
    ...parsed,
    limits: { ...defaultConfig.limits, ...parsed.limits },
    modules: { ...defaultConfig.modules, ...parsed.modules },
    exclude: parsed.exclude ?? []
  };
}
