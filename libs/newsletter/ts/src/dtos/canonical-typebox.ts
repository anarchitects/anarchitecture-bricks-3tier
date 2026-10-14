import { Type, type TSchema, type TUnsafe } from '@sinclair/typebox';
import { z } from 'zod';

export type Binding<S extends z.core.$ZodType> = TUnsafe<z.output<S>> &
  import('@sinclair/typebox', {
    with: { 'resolution-mode': 'require' }
  }).TUnsafe<z.output<S>> &
  (S extends z.ZodObject<infer Shape>
    ? { properties: { [K in keyof Shape]: Binding<Shape[K]> } }
    : object);

/** Bounded binding for Newsletter 0.1.0's subscription/native/ack schemas.
 * TypeBox Value retains UTF-16 lengths; JSON Schema alone is not equivalent.
 * Raw webhook authentication and conditional parsing are never projected here.
 */
export function canonicalTypeBox<S extends z.ZodType>(schema: S): Binding<S> {
  return bind(schema) as Binding<S>;
}

function bind(schema: z.core.$ZodType): TSchema {
  if (schema instanceof z.ZodOptional)
    return Type.Optional(bind(schema.unwrap()));
  if (schema instanceof z.ZodString) {
    const { pattern, minLength, maxLength } = z.toJSONSchema(schema);
    return Type.String({
      ...(pattern !== undefined && { pattern }),
      ...(minLength !== undefined && { minLength }),
      ...(maxLength !== undefined && { maxLength }),
    });
  }
  if (
    schema instanceof z.ZodLiteral &&
    schema.values.size === 1 &&
    schema.values.has(true)
  )
    return Type.Literal(true);
  if (schema instanceof z.ZodNumber) {
    const { minimum, multipleOf } = z.toJSONSchema(schema);
    if (multipleOf !== 1)
      throw new Error('Unsupported canonical Newsletter number');
    return Type.Integer({ ...(minimum !== undefined && { minimum }) });
  }
  if (
    schema instanceof z.ZodObject &&
    schema.def.catchall instanceof z.ZodNever
  )
    return Type.Object(
      Object.fromEntries(
        Object.entries(schema.shape).map(([key, value]) => [
          key,
          bind(value as z.ZodType),
        ]),
      ),
      { additionalProperties: false },
    );
  throw new Error(
    `Unsupported canonical Newsletter schema: ${schema._zod.def.type}`,
  );
}
