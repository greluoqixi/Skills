import { readFile, writeFile, mkdir, rename } from 'node:fs/promises';
import { dirname } from 'node:path';
import { normalizeConfig } from './core.js';

/**
 * Read the user's configuration, falling back to managed defaults when the file
 * is missing or unreadable. A corrupt file never blocks the plugin.
 * @param locations - resolved paths.
 * @returns the normalized configuration.
 */
export async function loadConfig(locations) {
  try {
    return normalizeConfig(JSON.parse(await readFile(locations.config, 'utf8')));
  } catch {
    return normalizeConfig({});
  }
}

/**
 * Persist configuration atomically: a sibling temporary file is renamed over the
 * target so a crash cannot leave a half-written JSON document.
 * @param locations - resolved paths.
 * @param config - normalized configuration.
 */
export async function saveConfig(locations, config) {
  await mkdir(dirname(locations.config), { recursive: true, mode: 0o700 });
  const temporary = `${locations.config}.${process.pid}.tmp`;
  await writeFile(temporary, JSON.stringify(config, null, 2) + '\n', { mode: 0o600 });
  await rename(temporary, locations.config);
}
