import { TypeSystem } from '@sinclair/typebox/system';
import { Value } from '@sinclair/typebox/value';
import { faker } from '@faker-js/faker';
import { FormDefinitionResponseSchema, FormDefinitionResponseDTO } from './form-definition-response.dto';

TypeSystem.Format('email', (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));
TypeSystem.Format('uri', (value) => /^https?:\/\/.+/.test(value));

const buildValidFormField = () => ({
  name: faker.lorem.word(),
  kind: faker.helpers.arrayElement(['string', 'email', 'textarea', 'boolean', 'select', 'file'] as const),
  required: faker.datatype.boolean(),
  minLength: faker.number.int({ min: 0, max: 100 }),
  maxLength: faker.number.int({ min: 101, max: 1000 }),
  pattern: '^[a-zA-Z0-9]+$',
  options: [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
  ],
  ui: {
    label: faker.lorem.words(2),
    placeholder: faker.lorem.sentence(),
    rows: faker.number.int({ min: 1, max: 10 }),
    help: faker.lorem.sentence(),
  },
});

const buildValidFormDefinitionResponse = (): FormDefinitionResponseDTO => ({
  id: faker.string.uuid(),
  version: faker.number.int({ min: 1, max: 100 }),
  fields: Array.from({ length: faker.number.int({ min: 1, max: 5 }) }, buildValidFormField),
  security: {
    honeypot: faker.lorem.word(),
    captcha: faker.helpers.arrayElement(['turnstile', 'hcaptcha', 'none'] as const),
  },
  delivery: {
    adminEmail: faker.internet.email(),
    autoReply: {
      enabled: faker.datatype.boolean(),
      templateId: faker.string.uuid(),
      subject: faker.lorem.sentence(),
    },
    webhooks: [
      {
        url: faker.internet.url(),
        secret: faker.string.alphanumeric(32),
      },
    ],
  },
});

describe('FormDefinitionResponseSchema', () => {
  it('declares the expected required fields', () => {
    expect(FormDefinitionResponseSchema.required).toStrictEqual([
      'id',
      'version',
      'fields',
    ]);
  });

  it('validates a correct form definition response', () => {
    const validResponse = buildValidFormDefinitionResponse();
    expect([...Value.Errors(FormDefinitionResponseSchema, validResponse)]).toStrictEqual([]);
  });

  it('validates minimal form definition response', () => {
    const minimalResponse = {
      id: faker.string.uuid(),
      version: 1,
      fields: [
        {
          name: 'test',
          kind: 'string' as const,
        },
      ],
    };
    expect([...Value.Errors(FormDefinitionResponseSchema, minimalResponse)]).toStrictEqual([]);
  });

  it('enforces id as string type', () => {
    const validResponse = buildValidFormDefinitionResponse();

    expect(
      [...Value.Errors(FormDefinitionResponseSchema, {
        ...validResponse,
        id: 123,
      })].length
    ).toBeGreaterThan(0);

    expect(
      [...Value.Errors(FormDefinitionResponseSchema, {
        ...validResponse,
        id: null,
      })].length
    ).toBeGreaterThan(0);
  });

  it('enforces version as integer with minimum 1', () => {
    const validResponse = buildValidFormDefinitionResponse();

    expect(
      [...Value.Errors(FormDefinitionResponseSchema, {
        ...validResponse,
        version: 0,
      })].length
    ).toBeGreaterThan(0);

    expect(
      [...Value.Errors(FormDefinitionResponseSchema, {
        ...validResponse,
        version: -1,
      })].length
    ).toBeGreaterThan(0);

    expect(
      [...Value.Errors(FormDefinitionResponseSchema, {
        ...validResponse,
        version: 1.5,
      })].length
    ).toBeGreaterThan(0);
  });

  it('enforces fields as array with valid field objects', () => {
    const validResponse = buildValidFormDefinitionResponse();

    expect(
      [...Value.Errors(FormDefinitionResponseSchema, {
        ...validResponse,
        fields: 'not-an-array',
      })].length
    ).toBeGreaterThan(0);

    expect(
      [...Value.Errors(FormDefinitionResponseSchema, {
        ...validResponse,
        fields: [{
          name: 'test',
          kind: 'invalid-kind',
        }],
      })].length
    ).toBeGreaterThan(0);

    expect(
      [...Value.Errors(FormDefinitionResponseSchema, {
        ...validResponse,
        fields: [{
          kind: 'string',
          // missing name
        }],
      })].length
    ).toBeGreaterThan(0);
  });

  it('validates field kind enum values', () => {
    const validResponse = buildValidFormDefinitionResponse();
    const validKinds = ['string', 'email', 'textarea', 'boolean', 'select', 'file'];

    for (const kind of validKinds) {
      expect(
        [...Value.Errors(FormDefinitionResponseSchema, {
          ...validResponse,
          fields: [{
            name: 'test',
            kind: kind as 'string' | 'email' | 'textarea' | 'boolean' | 'select' | 'file',
          }],
        })]
      ).toStrictEqual([]);
    }
  });

  it('validates optional security configuration', () => {
    const validResponse = buildValidFormDefinitionResponse();

    expect(
      [...Value.Errors(FormDefinitionResponseSchema, {
        ...validResponse,
        security: {
          honeypot: 'website',
          captcha: 'invalid-captcha',
        },
      })].length
    ).toBeGreaterThan(0);

    expect(
      [...Value.Errors(FormDefinitionResponseSchema, {
        ...validResponse,
        security: {
          captcha: 'turnstile',
        },
      })]
    ).toStrictEqual([]);
  });

  it('validates optional delivery configuration', () => {
    const validResponse = buildValidFormDefinitionResponse();

    expect(
      [...Value.Errors(FormDefinitionResponseSchema, {
        ...validResponse,
        delivery: {
          adminEmail: 'invalid-email',
        },
      })].length
    ).toBeGreaterThan(0);

    expect(
      [...Value.Errors(FormDefinitionResponseSchema, {
        ...validResponse,
        delivery: {
          adminEmail: faker.internet.email(),
          webhooks: [
            {
              url: 'invalid-url',
            },
          ],
        },
      })].length
    ).toBeGreaterThan(0);
  });

  it('rejects responses with missing required fields', () => {
    const validResponse = buildValidFormDefinitionResponse();

    const missingId = { ...validResponse } as Record<string, unknown>;
    delete missingId['id'];
    expect([...Value.Errors(FormDefinitionResponseSchema, missingId)].length).toBeGreaterThan(0);

    const missingVersion = { ...validResponse } as Record<string, unknown>;
    delete missingVersion['version'];
    expect([...Value.Errors(FormDefinitionResponseSchema, missingVersion)].length).toBeGreaterThan(0);

    const missingFields = { ...validResponse } as Record<string, unknown>;
    delete missingFields['fields'];
    expect([...Value.Errors(FormDefinitionResponseSchema, missingFields)].length).toBeGreaterThan(0);
  });
});
