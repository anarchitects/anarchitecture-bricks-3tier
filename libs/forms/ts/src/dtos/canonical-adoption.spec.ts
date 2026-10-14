import { readFileSync } from 'node:fs';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import * as canonical from '@anarchitects/forms-contracts';
import type { z } from 'zod';
import { describe, expect, it } from 'vitest';
import * as dtos from './index';
type Schema = {
  type?: string;
  properties?: Record<string, Schema>;
  items?: Schema;
  anyOf?: Schema[];
  const?: unknown;
  format?: string;
  minLength?: number;
  minItems?: number;
  minimum?: number;
};
const frozen = JSON.parse(
  readFileSync(
    new URL('./fixtures/legacy-schemas.json', import.meta.url),
    'utf8',
  ),
) as { schemas: Record<string, Schema> };
const current = dtos as unknown as Record<string, unknown>;
const source = canonical as unknown as Record<string, z.ZodType>;
const ajv = new Ajv({
  coerceTypes: 'array',
  useDefaults: true,
  removeAdditional: true,
});
addFormats(ajv);
function example(schema: Schema): unknown {
  if ('const' in schema) return schema.const;
  if (schema.anyOf) return example(schema.anyOf[0]);
  if (schema.type === 'object')
    return Object.fromEntries(
      Object.entries(schema.properties ?? {}).map(([key, value]) => [
        key,
        example(value),
      ]),
    );
  if (schema.type === 'array')
    return Array.from({ length: schema.minItems ?? 1 }, () =>
      example(schema.items ?? {}),
    );
  if (schema.type === 'string')
    return schema.format === 'uuid'
      ? '01900000-0000-7000-8000-000000000001'
      : schema.format === 'uri'
        ? 'https://example.test/hook'
        : schema.format === 'email'
          ? 'person@example.com'
          : schema.format === 'date-time'
            ? '2026-10-14T12:00:00.000Z'
            : 'a'.repeat(Math.max(schema.minLength ?? 1, 1));
  if (schema.type === 'integer' || schema.type === 'number')
    return schema.minimum ?? 1;
  if (schema.type === 'boolean') return true;
  if (schema.type === 'null') return null;
  return { opaque: ['value', 1, null] };
}

function paths(value: unknown, prefix: string[] = []): string[][] {
  if (!value || typeof value !== 'object' || Array.isArray(value))
    return [prefix];
  return Object.entries(value).flatMap(([key, item]) => [
    [...prefix, key],
    ...paths(item, [...prefix, key]),
  ]);
}
const values = [
  undefined,
  null,
  '',
  ' ',
  '1234',
  '12345678',
  '😀'.repeat(6),
  'a'.repeat(101),
  'bad@',
  'a..b@example.com',
  'a+b@example.com',
  12345678,
  Infinity,
  false,
  true,
  [],
  ['12345678'],
  [null],
  [1, 2],
  {},
  { extra: true },
];

function compare(
  name: string,
  previous: Schema,
  next: unknown,
  source?: z.ZodType,
) {
  const before = ajv.compile(previous),
    after = ajv.compile(JSON.parse(JSON.stringify(next)));
  const base = example(previous);
  const candidates: unknown[] = [base, {}, null, [base]];
  if (base && typeof base === 'object' && !Array.isArray(base)) {
    candidates.push({ ...base, extra: { nested: ['preserved', 1] } });
    for (const path of paths(base))
      for (const value of values) {
        const candidate = structuredClone(base) as Record<string, unknown>;
        let parent = candidate;
        for (const key of path.slice(0, -1))
          parent = parent[key] as Record<string, unknown>;
        const key = path[path.length - 1];
        if (value === undefined) delete parent[key];
        else parent[key] = value;
        candidates.push(candidate);
      }
  }
  for (const input of candidates) {
    const original = structuredClone(input),
      adapted = structuredClone(input);
    const valid = before(original);
    expect(
      after(adapted),
      `${name}: ${JSON.stringify(input)}; ${JSON.stringify(after.errors)}`,
    ).toBe(valid);
    if (valid) expect(adapted, name).toEqual(original);
    if (source) {
      const parsed = source.safeParse(input);
      expect(
        parsed.success,
        `${name}: canonical ${JSON.stringify(input)}`,
      ).toBe(valid);
      if (parsed.success) expect(parsed.data, name).toEqual(original);
    }
  }
}

describe('canonical Forms 0.1.0 compatibility bindings', () => {
  for (const [name, schema] of Object.entries(frozen.schemas)) {
    it(`retains the legacy TypeBox schema: ${name}`, () => {
      expect(JSON.parse(JSON.stringify(current[name]))).toEqual(schema);
    });
    it(`preserves transport acceptance and normalization: ${name}`, () => {
      const request = /(?:Request|Params|Query)Schema$/.test(name);
      compare(name, schema, current[name], request ? source[name] : undefined);
    });
  }
});
