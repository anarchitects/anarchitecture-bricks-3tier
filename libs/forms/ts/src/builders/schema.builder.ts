import { Type, TSchema } from '@sinclair/typebox';
import type { FormConfig, FormField } from '../models/form.types';

function tFromField(f: FormField): TSchema {
  const stringConstraints = {
    ...(typeof f.minLength === 'number' ? { minLength: f.minLength } : {}),
    ...(typeof f.maxLength === 'number' ? { maxLength: f.maxLength } : {}),
    ...(f.pattern ? { pattern: f.pattern } : {}),
  };

  if (f.kind === 'email') {
    return Type.String({ format: 'email', ...stringConstraints });
  }

  if (f.kind === 'boolean') {
    return Type.Boolean();
  }

  if (f.kind === 'file') {
    return Type.Object({
      fileId: Type.String(),
      name: Type.Optional(Type.String()),
    });
  }

  return Type.String(stringConstraints);
}

export function schemaFromConfig(cfg: FormConfig) {
  const props: Record<string, TSchema> = {};
  const required: string[] = [];
  for (const f of cfg.fields) {
    props[f.name] = tFromField(f);
    if (f.required) required.push(f.name);
  }
  return Type.Object(props, { additionalProperties: false, required });
}
