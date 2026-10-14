import {
  FormDefinitionResponseSchema,
  FormDeliveryEmailSchema,
  FormDeliveryUriSchema,
  SubmissionIdSchema,
  SubmissionRequestSchema,
} from '@anarchitects/forms-contracts';
import { Type, type TSchema, type TUnsafe } from '@sinclair/typebox';
import { z } from 'zod';

type LegacyOpaque<T> = T extends readonly (infer Item)[]
  ? LegacyOpaque<Item>[]
  : T extends object
    ? {
        [K in keyof T]: K extends 'payload'
          ? Record<string, unknown>
          : K extends 'schema'
            ? unknown
            : LegacyOpaque<T[K]>;
      }
    : T;
type LegacyOutput<S extends z.ZodType> = LegacyOpaque<
  S extends z.ZodObject<infer Shape>
    ? z.output<z.ZodObject<Shape>>
    : z.output<S>
>;
export type CompatibilitySchema<T> = TUnsafe<T> &
  import('@sinclair/typebox', {
    with: { 'resolution-mode': 'require' }
  }).TUnsafe<T>;

/** Bounded binding for Forms Contracts 0.1.0; AJV retains request coercion. */
export function canonicalTypeBox<S extends z.ZodType>(
  schema: S,
  strict = false,
): CompatibilitySchema<LegacyOutput<S>> {
  return bind(schema, strict) as CompatibilitySchema<LegacyOutput<S>>;
}

function bind(schema: z.core.$ZodType, strict: boolean): TSchema {
  if (schema instanceof z.ZodOptional)
    return Type.Optional(bind(schema.unwrap(), strict));
  // The canonical request version adds a refinement to an overflow-preserving
  // pipeline. Its bound is the same canonical version constraint as the response.
  if (schema === SubmissionRequestSchema.shape.formVersion)
    return bind(FormDefinitionResponseSchema.shape.version, strict);
  if (schema instanceof z.ZodPipe) return bind(schema.out, strict);
  if (schema === FormDeliveryEmailSchema)
    return Type.String({ format: 'email' });
  if (schema === FormDeliveryUriSchema) return Type.String({ format: 'uri' });
  if (schema === SubmissionIdSchema) return Type.String({ format: 'uuid' });
  if (schema._zod.def.type === 'string') {
    const { format, pattern, minLength, maxLength } = z.toJSONSchema(schema);
    const length =
      pattern &&
      /^\^\(\?:\[\\s\\S\]\)\{(\d+),(\d*)\}\(\?!\[\\s\\S\]\)$/.exec(pattern);
    return Type.String({
      ...(format && { format }),
      ...(!format && pattern && !length && { pattern }),
      ...(length && {
        minLength: Number(length[1]),
        ...(length[2] && { maxLength: Number(length[2]) }),
      }),
      ...(minLength !== undefined && { minLength }),
      ...(maxLength !== undefined && { maxLength }),
    });
  }
  if (schema instanceof z.ZodNumber) {
    const { minimum, maximum, multipleOf } = z.toJSONSchema(schema);
    const options = {
      ...(minimum !== undefined && { minimum }),
      ...(maximum !== undefined && { maximum }),
    };
    if (multipleOf !== 1) throw new Error('Unsupported canonical Forms number');
    return Type.Integer(options);
  }
  if (schema instanceof z.ZodBoolean) return Type.Boolean();
  if (schema instanceof z.ZodLiteral)
    return Type.Union(
      [...schema.values].map((value) => {
        if (
          typeof value !== 'string' &&
          typeof value !== 'boolean' &&
          typeof value !== 'number'
        )
          throw new Error('Unsupported canonical literal');
        return Type.Literal(value);
      }),
    );
  if (schema instanceof z.ZodEnum)
    return Type.Union(schema.options.map((value) => Type.Literal(value)));
  if (schema instanceof z.ZodArray)
    return Type.Array(bind(schema.element, strict));
  if (schema instanceof z.ZodRecord)
    return Type.Record(Type.String(), Type.Unknown());
  if (schema instanceof z.ZodLazy) return Type.Unknown();
  if (schema instanceof z.ZodObject)
    return Type.Object(
      Object.fromEntries(
        Object.entries(schema.shape).map(([key, value]) => [
          key,
          bind(value as z.ZodType, strict),
        ]),
      ),
      strict ? { additionalProperties: false } : {},
    );
  throw new Error(
    `Unsupported canonical Forms schema: ${schema._zod.def.type}`,
  );
}
