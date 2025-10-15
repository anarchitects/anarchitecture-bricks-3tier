import { Value } from '@sinclair/typebox/value';
import { faker } from '@faker-js/faker';
import { SubmissionResponseSchema, SubmissionResponseDTO } from './submission-response.dto';

const buildValidSubmissionResponse = (): SubmissionResponseDTO => ({
  success: faker.datatype.boolean(),
});

describe('SubmissionResponseSchema', () => {
  it('declares the expected required fields', () => {
    expect(SubmissionResponseSchema.required).toStrictEqual(['success']);
  });

  it('validates a correct submission response', () => {
    const validResponse = buildValidSubmissionResponse();
    expect([...Value.Errors(SubmissionResponseSchema, validResponse)]).toStrictEqual([]);
  });

  it('validates both success and failure responses', () => {
    expect(
      [...Value.Errors(SubmissionResponseSchema, { success: true })]
    ).toStrictEqual([]);

    expect(
      [...Value.Errors(SubmissionResponseSchema, { success: false })]
    ).toStrictEqual([]);
  });

  it('enforces success as boolean type', () => {
    expect(
      [...Value.Errors(SubmissionResponseSchema, {
        success: 'true',
      })].length
    ).toBeGreaterThan(0);

    expect(
      [...Value.Errors(SubmissionResponseSchema, {
        success: 1,
      })].length
    ).toBeGreaterThan(0);

    expect(
      [...Value.Errors(SubmissionResponseSchema, {
        success: null,
      })].length
    ).toBeGreaterThan(0);

    expect(
      [...Value.Errors(SubmissionResponseSchema, {
        success: undefined,
      })].length
    ).toBeGreaterThan(0);
  });

  it('rejects responses with missing required fields', () => {
    expect(
      [...Value.Errors(SubmissionResponseSchema, {})].length
    ).toBeGreaterThan(0);
  });



  it('captures specific TypeBox metadata', () => {
    const successSchema = SubmissionResponseSchema.properties['success'];

    expect(successSchema['type']).toBe('boolean');
  });
});
