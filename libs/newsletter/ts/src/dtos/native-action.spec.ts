import Ajv from 'ajv';
import { Value } from '@sinclair/typebox/value';
import { describe, expect, it } from 'vitest';
import {
  NewsletterNativeActionRequestSchema,
  NewsletterNativeActionResponseSchema,
  NewsletterNativeActionRouteSchema,
} from './index';

describe('native action transport contract', () => {
  const validate = new Ajv({ strict: true }).compile(
    NewsletterNativeActionRequestSchema,
  );
  it.each([
    [{ token: '' }, true],
    [{ token: 'malformed-but-neutral' }, true],
    [{ token: 'v1.c.' + 'a'.repeat(43) }, true],
    [{ token: 'x'.repeat(128) }, true],
    [{ token: 'x'.repeat(129) }, false],
    [{ token: 123 }, false],
    [{ token: null }, false],
    [{}, false],
    [{ token: 'secret', email: 'a@example.test' }, false],
  ])(
    'validates structure without disclosing token validity: %j',
    (input, expected) => {
      expect(validate(input)).toBe(expected);
      expect(Value.Check(NewsletterNativeActionRequestSchema, input)).toBe(
        expected,
      );
    },
  );
  it('exposes pure route schemas and a neutral response without membership fields', () => {
    expect(Object.keys(NewsletterNativeActionRouteSchema).sort()).toEqual([
      'body',
      'response',
    ]);
    expect(
      Value.Check(NewsletterNativeActionResponseSchema, { accepted: true }),
    ).toBe(true);
    expect(
      Value.Check(NewsletterNativeActionResponseSchema, {
        accepted: true,
        status: 'active',
      }),
    ).toBe(false);
  });
});
