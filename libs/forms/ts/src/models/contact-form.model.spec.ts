import { describe, it, expect } from 'vitest';
import { Value } from '@sinclair/typebox/value';
import { TypeSystem } from '@sinclair/typebox/system';
import { schemaFromConfig } from '../builders';
import { contactForm } from '../models';

TypeSystem.Format('email', (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));

const buildValidSubmission = () => ({
  name: 'Ada Lovelace',
  email: 'ada@example.test',
  message: 'Hello from the forms-ts suite.',
  consent: true,
});

describe('schemaFromConfig(contactForm)', () => {
  const schema = schemaFromConfig(contactForm);

  it('declares the expected required fields', () => {
    expect(schema.required).toStrictEqual([
      'name',
      'email',
      'message',
      'consent',
    ]);
  });

  it('enforces type and length constraints', () => {
    const validSubmission = buildValidSubmission();
    expect([...Value.Errors(schema, validSubmission)]).toStrictEqual([]);

    expect(
      [
        ...Value.Errors(schema, {
          ...validSubmission,
          email: 'not-an-email',
        }),
      ].length
    ).toBeGreaterThan(0);

    expect(
      [
        ...Value.Errors(schema, {
          ...validSubmission,
          name: 'A',
        }),
      ].length
    ).toBeGreaterThan(0);

    expect(
      [
        ...Value.Errors(schema, {
          ...validSubmission,
          message: 'short',
        }),
      ].length
    ).toBeGreaterThan(0);

    expect(
      [
        ...Value.Errors(schema, {
          ...validSubmission,
          consent: null as unknown as boolean,
        }),
      ].length
    ).toBeGreaterThan(0);

    expect(
      [
        ...Value.Errors(schema, {
          ...validSubmission,
          extra: 'not allowed',
        } as Record<string, unknown>),
      ].length
    ).toBeGreaterThan(0);

    const missingConsent = { ...validSubmission } as Record<string, unknown>;
    delete missingConsent.consent;
    expect([...Value.Errors(schema, missingConsent)].length).toBeGreaterThan(0);
  });

  it('captures specific TypeBox metadata', () => {
    const emailSchema = schema.properties.email;
    const consentSchema = schema.properties.consent;

    expect('format' in emailSchema ? emailSchema.format : undefined).toBe(
      'email'
    );
    expect(consentSchema.type).toBe('boolean');
  });
});
