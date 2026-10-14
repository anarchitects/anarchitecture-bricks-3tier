import { readFileSync } from 'node:fs';
import { Kind, type TSchema } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import * as canonical from '@anarchitects/newsletter-contracts';
import { describe, expect, it } from 'vitest';
import * as current from './index';

const frozen = JSON.parse(
  readFileSync(
    new URL('./fixtures/legacy-schemas.json', import.meta.url),
    'utf8',
  ),
);
function restore(value: Record<string, unknown>): TSchema {
  const result = { ...value } as TSchema;
  result[Kind] =
    'const' in value
      ? 'Literal'
      : typeof value['type'] === 'string'
        ? value['type'][0].toUpperCase() + value['type'].slice(1)
        : 'Unknown';
  if (value['properties'])
    result['properties'] = Object.fromEntries(
      Object.entries(
        value['properties'] as Record<string, Record<string, unknown>>,
      ).map(([key, child]) => [key, restore(child)]),
    );
  return result;
}
const cases = [
  [
    'NewsletterSubscriptionRequestSchema',
    canonical.NewsletterSubscriptionRequestSchema,
    {
      email: 'Reader@example.test',
      consent: true,
      consentVersion: 'v1',
      source: '',
      website: '',
    },
  ],
  [
    'NewsletterSubscriptionResponseSchema',
    canonical.NewsletterAcceptedResponseSchema,
    { accepted: true },
  ],
  [
    'NewsletterNativeActionRequestSchema',
    canonical.NewsletterNativeActionRequestSchema,
    { token: '' },
  ],
  [
    'NewsletterNativeActionResponseSchema',
    canonical.NewsletterAcceptedResponseSchema,
    { accepted: true },
  ],
  [
    'NewsletterWebhookResponseSchema',
    canonical.NewsletterWebhookResponseSchema,
    { recorded: 1, duplicates: 0 },
  ],
] as const;
const mutations = [
  undefined,
  null,
  true,
  false,
  0,
  1,
  -1,
  0.5,
  Infinity,
  '',
  ' ',
  '\n',
  'true',
  'person@example.test',
  'person@example.test\n',
  '😀'.repeat(65),
  '😀'.repeat(1025),
  'x'.repeat(2049),
  {},
  [],
  ['value'],
];
describe('canonical Newsletter 0.1.0 bindings', () => {
  for (const [name, schema, valid] of cases) {
    it(`preserves ${name} including UTF-16 and no coercion`, () => {
      const old = restore(frozen.schemas[name]);
      expect(JSON.parse(JSON.stringify(current[name]))).toEqual(
        frozen.schemas[name],
      );
      const inputs: unknown[] = [
        valid,
        null,
        {},
        [],
        { ...valid, unexpected: true },
      ];
      for (const key of Object.keys(valid))
        for (const mutation of mutations) {
          const input: Record<string, unknown> = { ...valid };
          if (mutation === undefined) delete input[key];
          else input[key] = mutation;
          inputs.push(input);
        }
      for (const input of inputs) {
        const expected = Value.Check(old, input);
        expect(Value.Check(current[name], input), JSON.stringify(input)).toBe(
          expected,
        );
        expect(schema.safeParse(input).success, JSON.stringify(input)).toBe(
          expected,
        );
      }
    });
  }
});
