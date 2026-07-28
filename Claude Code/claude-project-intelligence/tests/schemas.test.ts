import assert from "node:assert/strict";
import test from "node:test";
import { readFile } from "node:fs/promises";
import YAML from "yaml";
import { validateSchema } from "../src/schemas.js";

test("validates the module template", async () => {
  const text = await readFile(new URL("../templates/module.yaml", import.meta.url), "utf8");
  assert.doesNotThrow(() => validateSchema("module", YAML.parse(text)));
});

test("schema errors include a field path and suggestion", () => {
  assert.throws(
    () => validateSchema("file-manifest", { path: "../secret" }),
    /Schema validation failed/
  );
});
