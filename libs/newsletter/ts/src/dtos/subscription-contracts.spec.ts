import Ajv from 'ajv';
import { Value } from '@sinclair/typebox/value';
import { describe, expect, expectTypeOf, it } from 'vitest';
import {
  NewsletterSubscriptionRequestSchema,
  NewsletterSubscriptionResponseSchema,
  NewsletterSubscriptionRouteSchema,
  type NewsletterSubscriptionRequestDTO,
  type NewsletterSubscriptionResponseDTO,
} from './index';
import * as publicApi from '../index';
import type {
  NewsletterConsentEvent,
  NewsletterConsentGrantedEvent,
  NewsletterConsentPolicy,
  NewsletterConsentWithdrawnEvent,
  NewsletterWithdrawalEvent,
} from '../models';

const request: NewsletterSubscriptionRequestDTO = {
  email: 'Reader+updates@example.test',
  consent: true,
  consentVersion: 'policy-2026-10',
};

// Exercise the same JSON Schema through a server-style validator and TypeBox,
// without format registration or coercion that might turn "true" into consent.
const ajv = new Ajv({
  strict: true,
  coerceTypes: false,
  removeAdditional: false,
});
const validateRequest = ajv.compile(NewsletterSubscriptionRequestSchema);
const validateResponse = ajv.compile(NewsletterSubscriptionResponseSchema);

function checkRequest(input: unknown, valid: boolean) {
  expect(Value.Check(NewsletterSubscriptionRequestSchema, input)).toBe(valid);
  expect(validateRequest(input)).toBe(valid);
}

describe('subscription request', () => {
  it('accepts an affirmative request without rewriting its values', () => {
    const input = { ...request };
    checkRequest(input, true);
    expect(input).toEqual(request);
  });

  it.each([false, 'true', 1, null, undefined])(
    'rejects non-affirmative consent %s',
    (consent) => {
      checkRequest({ ...request, consent }, false);
    },
  );

  it.each(['', '   ', '\n', null, undefined])(
    'requires a non-blank consent version %s',
    (consentVersion) => {
      checkRequest({ ...request, consentVersion }, false);
    },
  );

  it('leaves version matching to the application instead of embedding a policy', () => {
    checkRequest({ ...request, consentVersion: 'another-host/v2' }, true);
  });

  it.each([
    '',
    'not-an-email',
    'a@@example.test',
    'a@example',
    ' a@example.test',
    'a@example.test ',
    'a@example.test\n',
    'a\n@example.test',
  ])('rejects malformed email %j', (email) => {
    checkRequest({ ...request, email }, false);
  });

  it('enforces the email length boundary', () => {
    checkRequest(
      { ...request, email: `${'a'.repeat(241)}@example.test` },
      true,
    );
    checkRequest(
      { ...request, email: `${'a'.repeat(242)}@example.test` },
      false,
    );
  });

  it('accepts optional attribution and honeypot values as data, without side effects', () => {
    checkRequest({ ...request, source: '/articles', website: '' }, true);
    checkRequest({ ...request, website: 'bot-filled' }, true);
  });

  it.each(['source', 'website'])(
    'bounds optional %s to a string of at most 2048 characters',
    (field) => {
      checkRequest({ ...request, [field]: 'x'.repeat(2048) }, true);
      checkRequest({ ...request, [field]: 'x'.repeat(2049) }, false);
      checkRequest({ ...request, [field]: 123 }, false);
    },
  );

  it.each([null, [], 'request', {}])(
    'rejects a missing or invalid object %j',
    (input) => {
      checkRequest(input, false);
    },
  );

  it.each(['consentText', 'ipAddress', 'recordedAt', 'providerId'])(
    'does not accept client-supplied %s',
    (field) => {
      checkRequest({ ...request, [field]: 'untrusted' }, false);
    },
  );
});

describe('subscription response and route', () => {
  it.each([
    [{ accepted: true }, true],
    [{ accepted: false }, false],
    [{}, false],
    [{ accepted: true, alreadySubscribed: true }, false],
    [{ accepted: true, subscriberId: 'opaque-id' }, false],
    [{ accepted: true, status: 'confirmed' }, false],
  ])('validates the non-enumerating response %j', (input, valid) => {
    expect(Value.Check(NewsletterSubscriptionResponseSchema, input)).toBe(
      valid,
    );
    expect(validateResponse(input)).toBe(valid);
  });

  it('exports a pure subscription route with the same DTOs', () => {
    expect(Object.keys(NewsletterSubscriptionRouteSchema).sort()).toEqual([
      'body',
      'response',
    ]);
    expect(NewsletterSubscriptionRouteSchema.body).toBe(
      NewsletterSubscriptionRequestSchema,
    );
    expect(NewsletterSubscriptionRouteSchema.response).toEqual({
      202: NewsletterSubscriptionResponseSchema,
    });
  });

  it('exposes only the intended runtime schemas from the package root', () => {
    expect(Object.keys(publicApi).sort()).toEqual([
      'NewsletterSubscriptionRequestSchema',
      'NewsletterSubscriptionResponseSchema',
      'NewsletterSubscriptionRouteSchema',
    ]);
  });
});

describe('public model types', () => {
  it('keeps affirmative consent literal and evidence distinct from provider status', () => {
    expectTypeOf<
      NewsletterSubscriptionRequestDTO['consent']
    >().toEqualTypeOf<true>();
    expectTypeOf<NewsletterSubscriptionResponseDTO>().toEqualTypeOf<{
      accepted: true;
    }>();
    expectTypeOf<NewsletterConsentPolicy>().toEqualTypeOf<{
      readonly version: string;
      readonly text: string;
    }>();
    expectTypeOf<
      Extract<NewsletterConsentEvent, { kind: 'granted' }>
    >().toEqualTypeOf<NewsletterConsentGrantedEvent>();
    expectTypeOf<
      Extract<NewsletterConsentEvent, { kind: 'withdrawn' }>
    >().toEqualTypeOf<NewsletterConsentWithdrawnEvent>();
    expectTypeOf<NewsletterConsentWithdrawnEvent>().toExtend<NewsletterWithdrawalEvent>();
    expectTypeOf<
      NewsletterConsentWithdrawnEvent['consentText']
    >().toEqualTypeOf<undefined>();
    expectTypeOf<NewsletterConsentEvent['recordedAt']>().toEqualTypeOf<Date>();
  });
});
