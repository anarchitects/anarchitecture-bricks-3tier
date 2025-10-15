import { TypeSystem } from '@sinclair/typebox/system';
import { Value } from '@sinclair/typebox/value';
import { faker } from '@faker-js/faker';
import { SubmissionRequestSchema, SubmissionRequestDTO } from './submission-request.dto';

TypeSystem.Format('email', (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value));

const buildValidSubmissionRequest = (): SubmissionRequestDTO => ({
  formId: faker.string.uuid(),
  formVersion: faker.number.int({ min: 1, max: 100 }),
  payload: {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    message: faker.lorem.sentence(),
    consent: faker.datatype.boolean(),
  },
});

describe('SubmissionRequestSchema', () => {
  it('declares the expected required fields', () => {
    expect(SubmissionRequestSchema.required).toStrictEqual([
      'formId',
      'formVersion',
      'payload',
    ]);
  });

  it('validates a correct submission request', () => {
    const validSubmission = buildValidSubmissionRequest();
    expect([...Value.Errors(SubmissionRequestSchema, validSubmission)]).toStrictEqual([]);
  });

  it('enforces formId as string type', () => {
    const validSubmission = buildValidSubmissionRequest();

    expect(
      [...Value.Errors(SubmissionRequestSchema, {
        ...validSubmission,
        formId: 123,
      })].length
    ).toBeGreaterThan(0);

    expect(
      [...Value.Errors(SubmissionRequestSchema, {
        ...validSubmission,
        formId: null,
      })].length
    ).toBeGreaterThan(0);

    expect(
      [...Value.Errors(SubmissionRequestSchema, {
        ...validSubmission,
        formId: undefined,
      })].length
    ).toBeGreaterThan(0);
  });

  it('enforces formVersion as integer with minimum 1', () => {
    const validSubmission = buildValidSubmissionRequest();

    expect(
      [...Value.Errors(SubmissionRequestSchema, {
        ...validSubmission,
        formVersion: 'not-a-number',
      })].length
    ).toBeGreaterThan(0);

    expect(
      [...Value.Errors(SubmissionRequestSchema, {
        ...validSubmission,
        formVersion: 0,
      })].length
    ).toBeGreaterThan(0);

    expect(
      [...Value.Errors(SubmissionRequestSchema, {
        ...validSubmission,
        formVersion: -1,
      })].length
    ).toBeGreaterThan(0);

    expect(
      [...Value.Errors(SubmissionRequestSchema, {
        ...validSubmission,
        formVersion: 1.5,
      })].length
    ).toBeGreaterThan(0);

    expect(
      [...Value.Errors(SubmissionRequestSchema, {
        ...validSubmission,
        formVersion: 1,
      })]
    ).toStrictEqual([]);
  });

  it('enforces payload as record type', () => {
    const validSubmission = buildValidSubmissionRequest();

    expect(
      [...Value.Errors(SubmissionRequestSchema, {
        ...validSubmission,
        payload: 'not-an-object',
      })].length
    ).toBeGreaterThan(0);

    expect(
      [...Value.Errors(SubmissionRequestSchema, {
        ...validSubmission,
        payload: 123,
      })].length
    ).toBeGreaterThan(0);

    expect(
      [...Value.Errors(SubmissionRequestSchema, {
        ...validSubmission,
        payload: null,
      })].length
    ).toBeGreaterThan(0);

    expect(
      [...Value.Errors(SubmissionRequestSchema, {
        ...validSubmission,
        payload: {},
      })]
    ).toStrictEqual([]);

    expect(
      [...Value.Errors(SubmissionRequestSchema, {
        ...validSubmission,
        payload: {
          anyKey: 'anyValue',
          anotherKey: 42,
          booleanKey: true,
          arrayKey: [1, 2, 3],
          objectKey: { nested: 'value' },
        },
      })]
    ).toStrictEqual([]);
  });

  it('rejects submissions with missing required fields', () => {
    const validSubmission = buildValidSubmissionRequest();

    const missingFormId = { ...validSubmission } as Record<string, unknown>;
    delete missingFormId['formId'];
    expect([...Value.Errors(SubmissionRequestSchema, missingFormId)].length).toBeGreaterThan(0);

    const missingFormVersion = { ...validSubmission } as Record<string, unknown>;
    delete missingFormVersion['formVersion'];
    expect([...Value.Errors(SubmissionRequestSchema, missingFormVersion)].length).toBeGreaterThan(0);

    const missingPayload = { ...validSubmission } as Record<string, unknown>;
    delete missingPayload['payload'];
    expect([...Value.Errors(SubmissionRequestSchema, missingPayload)].length).toBeGreaterThan(0);
  });



  it('captures specific TypeBox metadata', () => {
    const formIdSchema = SubmissionRequestSchema.properties['formId'];
    const formVersionSchema = SubmissionRequestSchema.properties['formVersion'];
    const payloadSchema = SubmissionRequestSchema.properties['payload'];

    expect(formIdSchema['type']).toBe('string');
    expect(formVersionSchema['type']).toBe('integer');
    expect(formVersionSchema['minimum']).toBe(1);
    expect(payloadSchema['type']).toBe('object');
    expect(payloadSchema['patternProperties']).toBeDefined();
  });
});
