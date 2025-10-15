import { Value } from '@sinclair/typebox/value';
import { faker } from '@faker-js/faker';
import { FormDefinitionRequestSchema, FormDefinitionRequestDTO } from './form-definition-request.dto';

const buildValidFormDefinitionRequest = (): FormDefinitionRequestDTO => ({
  formId: faker.string.uuid(),
  formVersion: faker.number.int({ min: 1, max: 100 }),
});

describe('FormDefinitionRequestSchema', () => {
  it('declares the expected required fields', () => {
    expect(FormDefinitionRequestSchema.required).toStrictEqual([
      'formId',
      'formVersion',
    ]);
  });

  it('validates a correct form definition request', () => {
    const validRequest = buildValidFormDefinitionRequest();
    expect([...Value.Errors(FormDefinitionRequestSchema, validRequest)]).toStrictEqual([]);
  });

  it('enforces formId as string type', () => {
    const validRequest = buildValidFormDefinitionRequest();

    expect(
      [...Value.Errors(FormDefinitionRequestSchema, {
        ...validRequest,
        formId: 123,
      })].length
    ).toBeGreaterThan(0);

    expect(
      [...Value.Errors(FormDefinitionRequestSchema, {
        ...validRequest,
        formId: null,
      })].length
    ).toBeGreaterThan(0);

    expect(
      [...Value.Errors(FormDefinitionRequestSchema, {
        ...validRequest,
        formId: '',
      })]
    ).toStrictEqual([]);
  });

  it('enforces formVersion as integer with minimum 1', () => {
    const validRequest = buildValidFormDefinitionRequest();

    expect(
      [...Value.Errors(FormDefinitionRequestSchema, {
        ...validRequest,
        formVersion: 'not-a-number',
      })].length
    ).toBeGreaterThan(0);

    expect(
      [...Value.Errors(FormDefinitionRequestSchema, {
        ...validRequest,
        formVersion: 0,
      })].length
    ).toBeGreaterThan(0);

    expect(
      [...Value.Errors(FormDefinitionRequestSchema, {
        ...validRequest,
        formVersion: -1,
      })].length
    ).toBeGreaterThan(0);

    expect(
      [...Value.Errors(FormDefinitionRequestSchema, {
        ...validRequest,
        formVersion: 1.5,
      })].length
    ).toBeGreaterThan(0);

    expect(
      [...Value.Errors(FormDefinitionRequestSchema, {
        ...validRequest,
        formVersion: 1,
      })]
    ).toStrictEqual([]);

    expect(
      [...Value.Errors(FormDefinitionRequestSchema, {
        ...validRequest,
        formVersion: 999,
      })]
    ).toStrictEqual([]);
  });

  it('rejects requests with missing required fields', () => {
    const validRequest = buildValidFormDefinitionRequest();

    const missingFormId = { ...validRequest } as Record<string, unknown>;
    delete missingFormId['formId'];
    expect([...Value.Errors(FormDefinitionRequestSchema, missingFormId)].length).toBeGreaterThan(0);

    const missingFormVersion = { ...validRequest } as Record<string, unknown>;
    delete missingFormVersion['formVersion'];
    expect([...Value.Errors(FormDefinitionRequestSchema, missingFormVersion)].length).toBeGreaterThan(0);
  });



  it('captures specific TypeBox metadata', () => {
    const formIdSchema = FormDefinitionRequestSchema.properties['formId'];
    const formVersionSchema = FormDefinitionRequestSchema.properties['formVersion'];

    expect(formIdSchema['type']).toBe('string');
    expect(formVersionSchema['type']).toBe('integer');
    expect(formVersionSchema['minimum']).toBe(1);
  });
});
