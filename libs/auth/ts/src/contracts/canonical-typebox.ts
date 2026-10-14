import { RegisterRequestSchema } from '@anarchitects/auth-contracts';
import { Type, type TSchema, type TUnsafe } from '@sinclair/typebox';
import { z } from 'zod';

export type CompatibilitySchema<T> = TUnsafe<T> &
  import('@sinclair/typebox', {
    with: { 'resolution-mode': 'require' }
  }).TUnsafe<T>;
// Legacy DTOs intentionally expose opaque JSON as unknown; their serialization
// is checked at the HTTP boundary. Preserve optional fields without catchall
// index signatures in the TypeBox-facing API.
type LegacyOpaque<T> = T extends readonly (infer Item)[]
  ? LegacyOpaque<Item>[]
  : T extends object
    ? {
        [K in keyof T]: K extends 'user'
          ? unknown
          : K extends 'conditions' | 'extensions' | 'clientExtensionResults'
            ? Record<string, unknown>
            : LegacyOpaque<T[K]>;
      }
    : T;
type LegacyOutput<S extends z.ZodType> = LegacyOpaque<
  S extends z.ZodObject<infer Shape>
    ? z.output<z.ZodObject<Shape>>
    : z.output<S>
>;

/**
 * Transitional binding for the audited Auth 0.1.0 graph, not a general Zod
 * converter. Fastify/AJV retains JSON scalar/array coercion and extra-field
 * removal. Domain constraints come exclusively from the canonical graph.
 */
export function canonicalTypeBox<S extends z.ZodType>(
  schema: S,
  options: { legacyOpenObject?: boolean } = {},
): CompatibilitySchema<LegacyOutput<S>> {
  const result = bind(schema);
  if (options.legacyOpenObject) delete result['additionalProperties'];
  return result as CompatibilitySchema<LegacyOutput<S>>;
}

const emailPattern = z.toJSONSchema(
  RegisterRequestSchema.shape.email.out,
).pattern;

function stringOptions(schema: z.ZodString): Record<string, unknown> {
  const json = z.toJSONSchema(schema, { io: 'output' });
  const options: Record<string, unknown> = {};
  const parts = [json, ...(json.allOf ?? [])];
  for (const part of parts) {
    if (typeof part !== 'object')
      throw new Error('Unsupported canonical string');
    for (const key of ['minLength', 'maxLength', 'format'] as const) {
      if (part[key] !== undefined) options[key] = part[key];
    }
    if (part.pattern) {
      // Canonical wireString counts code points, as JSON Schema min/maxLength do.
      const length =
        /^\^\(\?:\[\\s\\S\]\)\{(\d+),(\d*)\}\(\?!\[\\s\\S\]\)$/.exec(
          part.pattern,
        );
      if (length) {
        options['minLength'] = Number(length[1]);
        if (length[2]) options['maxLength'] = Number(length[2]);
      } else if (part.pattern === emailPattern) {
        options['format'] = 'email';
      } else if (options['pattern'] !== undefined) {
        throw new Error(
          'Multiple canonical patterns require an audited binding',
        );
      } else {
        options['pattern'] = part.pattern;
        // Anchored one-or-more character classes imply a nonempty string.
        // Retain the redundant minLength exposed by the legacy DTO/OpenAPI.
        if (/^\^\[[^\]]+\]\+\$$/.test(part.pattern)) options['minLength'] = 1;
      }
    }
  }
  return options;
}

function bind(schema: z.core.$ZodType): TSchema {
  if (schema instanceof z.ZodOptional)
    return Type.Optional(bind(schema.unwrap()));
  if (schema instanceof z.ZodPipe) return bind(schema.out);
  if (schema instanceof z.ZodNullable)
    return Type.Union([bind(schema.unwrap()), Type.Null()]);
  if (schema instanceof z.ZodString) return Type.String(stringOptions(schema));
  if (schema instanceof z.ZodBoolean) return Type.Boolean();
  if (schema instanceof z.ZodNull) return Type.Null();
  if (schema instanceof z.ZodLiteral)
    return Type.Union(
      [...schema.values].map((value) => {
        if (value === null) return Type.Null();
        if (
          typeof value !== 'string' &&
          typeof value !== 'number' &&
          typeof value !== 'boolean'
        )
          throw new Error('Unsupported literal');
        return Type.Literal(value);
      }),
    );
  if (schema instanceof z.ZodEnum)
    return Type.Union(schema.options.map((value) => Type.Literal(value)));
  if (schema instanceof z.ZodNumber) {
    const { minimum, maximum, multipleOf } = z.toJSONSchema(schema);
    const options = {
      ...(minimum !== undefined && { minimum }),
      ...(maximum !== undefined && { maximum }),
    };
    return multipleOf === 1
      ? Type.Integer(options)
      : Type.Number({
          ...options,
          ...(multipleOf !== undefined && { multipleOf }),
        });
  }
  if (schema instanceof z.ZodArray) {
    const checks = schema._zod.def.checks ?? [];
    const options: Record<string, number> = {};
    for (const check of checks) {
      const def = check._zod.def;
      if (def.check === 'min_length' && 'minimum' in def)
        options['minItems'] = Number(def.minimum);
      else if (def.check === 'max_length' && 'maximum' in def)
        options['maxItems'] = Number(def.maximum);
      else throw new Error('Unsupported canonical array check');
    }
    return Type.Array(bind(schema.element), options);
  }
  if (schema instanceof z.ZodUnion) {
    // Canonical arrayInput is array | scalar-to-array, with the same item graph.
    if (
      schema.options.length === 2 &&
      schema.options[0] instanceof z.ZodArray &&
      schema.options[1] instanceof z.ZodPipe
    )
      return bind(schema.options[0]);
    return Type.Union(schema.options.map((item) => bind(item as z.ZodType)));
  }
  if (schema instanceof z.ZodIntersection) {
    const left = bind(schema.def.left),
      right = bind(schema.def.right);
    if (
      left['type'] !== 'string' ||
      right['type'] !== 'string' ||
      (left['pattern'] && right['pattern'])
    )
      throw new Error('Unsupported canonical intersection');
    return Type.String({ ...left, ...right });
  }
  if (schema instanceof z.ZodObject) {
    const catchall = schema.def.catchall;
    return Type.Object(
      Object.fromEntries(
        Object.entries(schema.shape).map(([key, value]) => [
          key,
          bind(value as z.ZodType),
        ]),
      ),
      catchall instanceof z.ZodLazy ? {} : { additionalProperties: false },
    );
  }
  if (schema instanceof z.ZodRecord)
    return Type.Record(Type.String(), bind(schema.valueType));
  // All lazy nodes in the pinned Auth graph represent opaque decoded JSON.
  // The legacy public TypeBox surface intentionally exposes these as unknown.
  if (schema instanceof z.ZodLazy) return Type.Unknown();
  throw new Error(`Unsupported canonical Auth schema: ${schema._zod.def.type}`);
}
