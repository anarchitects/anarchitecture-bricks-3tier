import { FormatRegistry } from '@sinclair/typebox';
import { Value } from '@sinclair/typebox/value';
import {
  SubmissionIdParamsSchema,
  SubmissionResponseSchema,
  SubmissionsQuerySchema,
  SubmissionsResponseSchema,
} from './index';

FormatRegistry.Set('date-time', (value) => !Number.isNaN(Date.parse(value)));
FormatRegistry.Set('uuid', (value) =>
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value),
);

describe('submissions read contracts', () => {
  it.each([
    {},
    { formId: 'contact' },
    { formId: 'contact', formVersion: 2 },
    { formVersion: 2 },
  ])('accepts list filters %p', (query) => {
    expect(Value.Check(SubmissionsQuerySchema, query)).toBe(true);
  });

  it.each([
    { formId: '' },
    { formId: 42 },
    { formVersion: 0 },
    { formVersion: -1 },
    { formVersion: 1.5 },
    { formVersion: '2' },
    { formVersion: null },
  ])('rejects invalid list filters %p', (query) => {
    expect(Value.Check(SubmissionsQuerySchema, query)).toBe(false);
  });

  it('requires a UUID submission id', () => {
    expect(
      Value.Check(SubmissionIdParamsSchema, {
        submissionId: '01900000-0000-7000-8000-000000000001',
      }),
    ).toBe(true);
    for (const params of [
      {},
      { submissionId: '' },
      { submissionId: 1 },
      { submissionId: 'not-a-uuid' },
    ]) {
      expect(Value.Check(SubmissionIdParamsSchema, params)).toBe(false);
    }
  });

  it('uses the existing detail response contract for every list item', () => {
    const submission = {
      id: 'submission-1',
      formId: 'contact',
      formVersion: 1,
      payload: { name: 'Jane' },
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
    };
    expect(Value.Check(SubmissionResponseSchema, submission)).toBe(true);
    expect(Value.Check(SubmissionsResponseSchema, [submission])).toBe(true);
    expect(Value.Check(SubmissionsResponseSchema, [])).toBe(true);
    expect(
      Value.Check(SubmissionsResponseSchema, [
        { ...submission, formVersion: 0 },
      ]),
    ).toBe(false);
    expect(
      Value.Check(SubmissionsResponseSchema, [
        { ...submission, createdAt: 'invalid' },
      ]),
    ).toBe(false);
    expect(Value.Check(SubmissionsResponseSchema, submission)).toBe(false);
  });
});
