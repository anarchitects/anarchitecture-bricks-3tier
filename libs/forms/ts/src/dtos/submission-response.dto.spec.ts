import { Value } from '@sinclair/typebox/value';
import { FormatRegistry } from '@sinclair/typebox';
import { faker } from '@faker-js/faker';
import {
  SubmissionResponseSchema,
  SubmissionResponseDTO,
} from './submission-response.dto';

const buildValidSubmissionResponse = (): SubmissionResponseDTO => ({
  id: faker.string.uuid(),
  formId: 'contact_default',
  formVersion: 1,
  payload: {
    email: faker.internet.email(),
    message: faker.lorem.sentence(),
  },
  createdAt: faker.date.recent().toISOString(),
  updatedAt: faker.date.recent().toISOString(),
});

FormatRegistry.Set('date-time', (value: unknown): value is string => {
  return typeof value === 'string' && !Number.isNaN(Date.parse(value));
});

describe('SubmissionResponseSchema', () => {
  it('declares the expected required fields', () => {
    expect(SubmissionResponseSchema.required).toStrictEqual([
      'id',
      'formId',
      'formVersion',
      'payload',
      'createdAt',
      'updatedAt',
    ]);
  });

  it('validates a correct submission response', () => {
    const validResponse = buildValidSubmissionResponse();
    expect([
      ...Value.Errors(SubmissionResponseSchema, validResponse),
    ]).toStrictEqual([]);
  });

  it('rejects responses with missing required fields', () => {
    expect(
      [...Value.Errors(SubmissionResponseSchema, {})].length
    ).toBeGreaterThan(0);
  });

  it('enforces payload as record/object', () => {
    const invalid = {
      ...buildValidSubmissionResponse(),
      payload: 'invalid',
    };

    expect(
      [...Value.Errors(SubmissionResponseSchema, invalid)].length
    ).toBeGreaterThan(0);
  });

  it('captures specific TypeBox metadata', () => {
    const idSchema = SubmissionResponseSchema.properties['id'];
    const createdAtSchema = SubmissionResponseSchema.properties['createdAt'];

    expect(idSchema['type']).toBe('string');
    expect(createdAtSchema['format']).toBe('date-time');
  });
});
