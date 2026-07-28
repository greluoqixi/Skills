import Ajv2020, { type ErrorObject } from "ajv/dist/2020.js";
import projectIndexSchema from "../schemas/project-index.schema.json" with { type: "json" };
import areaSchema from "../schemas/area.schema.json" with { type: "json" };
import moduleSchema from "../schemas/module.schema.json" with { type: "json" };
import fileSchema from "../schemas/file-manifest.schema.json" with { type: "json" };
import moduleManifestSchema from "../schemas/module-manifest.schema.json" with { type: "json" };
import stateSchema from "../schemas/state.schema.json" with { type: "json" };
import bugSchema from "../schemas/verified-bug.schema.json" with { type: "json" };
import configSchema from "../schemas/project-config.schema.json" with { type: "json" };
import { CpiError } from "./errors.js";

const schemas: Record<string, object> = {
  "project-index": projectIndexSchema,
  area: areaSchema,
  module: moduleSchema,
  "file-manifest": fileSchema,
  "module-manifest": moduleManifestSchema,
  state: stateSchema,
  bug: bugSchema,
  config: configSchema
};

const AjvConstructor = Ajv2020 as unknown as new (options?: Record<string, unknown>) => {
  compile(schema: object): {
    (data: unknown): boolean;
    errors?: ErrorObject[] | null;
  };
};
const ajv = new AjvConstructor({ allErrors: true, strict: false, validateFormats: false });
const validators = new Map(Object.entries(schemas).map(([name, schema]) => [name, ajv.compile(schema)]));

function suggestion(error: ErrorObject): string {
  if (error.keyword === "required") return `add required field ${(error.params as any).missingProperty}`;
  if (error.keyword === "additionalProperties") return `remove unknown field ${(error.params as any).additionalProperty} or move it under extensions`;
  if (error.keyword === "pattern") return "use a safe repository-relative path or a valid stable ID";
  return `expected ${error.keyword} constraint`;
}

export function validateSchema(name: keyof typeof schemas | string, data: unknown): void {
  const validate = validators.get(name);
  if (!validate) throw new CpiError(`Unknown schema: ${name}`, 2);
  if (!validate(data)) {
    const details = (validate.errors ?? []).map((error) => ({
      path: error.instancePath || "$",
      message: error.message,
      suggestion: suggestion(error)
    }));
    throw new CpiError(`Schema validation failed for ${name} at ${details[0]?.path ?? "$"}: ${details[0]?.message}`, 2, details);
  }
}
