import { readFileSync } from 'node:fs';
import Ajv from 'ajv';
import addFormats from 'ajv-formats';
import * as canonical from '@anarchitects/identity-contracts';
import type { z } from 'zod';
import { describe, expect, it } from 'vitest';
import * as dtos from '../src/dtos/index';

const frozen = JSON.parse(
  readFileSync(
    new URL('./fixtures/legacy-schemas.json', import.meta.url),
    'utf8',
  ),
) as { schemas: Record<string, object> };
const ajv = new Ajv({
  coerceTypes: 'array',
  useDefaults: true,
  removeAdditional: true,
});
addFormats(ajv);
const inputs = [
  undefined,
  null,
  '',
  ' ',
  'name',
  123,
  Infinity,
  false,
  [],
  ['name'],
  [null],
  [1, 2],
  {},
];
const requests: [keyof typeof dtos, z.ZodObject, Record<string, unknown>][] = [
  [
    'CreateUserProfileRequestSchema',
    canonical.CreateUserProfileRequestSchema,
    { authUserId: 'auth-id' },
  ],
  [
    'UpdateUserProfileRequestSchema',
    canonical.UpdateUserProfileRequestSchema,
    {},
  ],
  [
    'AuthUserIdParamsSchema',
    canonical.AuthUserIdParamsSchema,
    { authUserId: 'auth-id' },
  ],
  [
    'UserProfileIdParamsSchema',
    canonical.UserProfileIdParamsSchema,
    { profileId: 'profile-id' },
  ],
];

describe('pinned canonical Identity adoption', () => {
  for (const [name, source, base] of requests)
    it(`preserves ${name} coercion, nulls and extra fields`, () => {
      const before = ajv.compile(frozen.schemas[name]);
      const after = ajv.compile(JSON.parse(JSON.stringify(dtos[name])));
      const candidates: unknown[] = [
        base,
        {},
        null,
        [base],
        { ...base, extra: { retained: true } },
      ];
      for (const key of Object.keys(source.shape))
        for (const value of inputs) candidates.push({ ...base, [key]: value });
      for (const input of candidates) {
        const original = structuredClone(input),
          adapted = structuredClone(input);
        const valid = before(original),
          parsed = source.safeParse(input);
        expect(after(adapted), `${name}: ${JSON.stringify(input)}`).toBe(valid);
        expect(
          parsed.success,
          `${name}: canonical ${JSON.stringify(input)}`,
        ).toBe(valid);
        if (valid) {
          expect(adapted).toEqual(original);
          if (parsed.success) expect(parsed.data).toEqual(original);
        }
      }
    });
  it('preserves the nullable public response and request DTO surface', () => {
    const request: dtos.UpdateUserProfileRequestDTO = { displayName: null };
    expect(request.displayName).toBeNull();
    expect(JSON.parse(JSON.stringify(dtos.UserProfileSchema))).toEqual(
      frozen.schemas['UserProfileSchema'],
    );
  });
});
