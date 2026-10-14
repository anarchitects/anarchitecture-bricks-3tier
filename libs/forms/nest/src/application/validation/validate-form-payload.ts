import { Ajv } from 'ajv';
import addFormats from 'ajv-formats';
import { schemaFromConfig } from '@anarchitects/forms-ts/builders';
import type { FormConfig } from '@anarchitects/forms-ts/models';

const ajv = new Ajv({
  coerceTypes: false,
  removeAdditional: false,
  useDefaults: false,
  allErrors: false,
});
addFormats(ajv);

/** Domain validation is independent of the broad canonical transport envelope. */
export function validateFormPayload(
  config: FormConfig,
  payload: unknown,
): boolean {
  // Compile the exact fetched version; never cache by form ID alone.
  const schema = schemaFromConfig(config);
  const validate = ajv.compile(schema);
  // Definitions are fetched per request; do not retain every generated schema.
  ajv.removeSchema(schema);
  if (!validate(payload)) return false;
  const values = payload as Record<string, unknown>;
  return (config.validationRules ?? []).every((rule) => {
    if (rule.kind !== 'matchFields')
      throw new Error('Unsupported form validation rule.');
    return values[rule.sourceField] === values[rule.targetField];
  });
}
