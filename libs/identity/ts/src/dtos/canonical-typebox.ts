import { Type, type TSchema, type TUnsafe } from '@sinclair/typebox';
import { z } from 'zod';

type RequiredKeys<S extends z.ZodObject> = {
  [K in keyof S['shape']]: S['shape'][K] extends z.ZodOptional ? never : K;
}[keyof S['shape']];

/** Preserve the published nullable request DTO surface before AJV coercion. */
export type ProfileRequest<S extends z.ZodObject> = {
  [K in RequiredKeys<S>]: z.output<S['shape'][K]>;
} & {
  [K in Exclude<keyof S['shape'], RequiredKeys<S>>]?: z.output<
    S['shape'][K]
  > | null;
};

export function profileRequest<S extends z.ZodObject>(
  schema: S,
): TUnsafe<ProfileRequest<S>> {
  return bind(schema, true) as TUnsafe<ProfileRequest<S>>;
}

export function profileSchema<S extends z.ZodObject>(
  schema: S,
): TUnsafe<z.output<S>> {
  return bind(schema, false) as TUnsafe<z.output<S>>;
}

// Bounded adapter for Identity 0.0.1. Domain fields are enumerated only by the
// canonical graph; no request schema or validation rules are authored here.
function bind(schema: z.core.$ZodType, request: boolean): TSchema {
  if (schema instanceof z.ZodOptional) {
    const field = bind(schema.unwrap(), request);
    return Type.Optional(request ? Type.Union([field, Type.Null()]) : field);
  }
  if (schema instanceof z.ZodPipe) return bind(schema.out, request);
  if (schema instanceof z.ZodNullable)
    return Type.Union([bind(schema.unwrap(), request), Type.Null()]);
  if (schema._zod.def.type === 'string') {
    const { format, pattern, minLength, maxLength } = z.toJSONSchema(schema);
    // Preserve the legacy date-time format validator and nonblank-ID metadata.
    return Type.String({
      ...(format && { format }),
      ...(!format && pattern && { pattern }),
      ...(pattern === '^\\S+$' && { minLength: 1 }),
      ...(minLength !== undefined && { minLength }),
      ...(maxLength !== undefined && { maxLength }),
    });
  }
  if (schema instanceof z.ZodObject) {
    return Type.Object(
      Object.fromEntries(
        Object.entries(schema.shape).map(([key, value]) => [
          key,
          bind(value as z.core.$ZodType, request),
        ]),
      ),
    );
  }
  throw new Error(
    `Unsupported canonical Identity schema: ${schema._zod.def.type}`,
  );
}
