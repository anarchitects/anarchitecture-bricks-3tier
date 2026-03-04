import { Value } from '@sinclair/typebox/value';
import { SuccessResponseSchema } from './success-response.dto';

describe('SuccessResponseSchema', () => {
  const validate = (payload: unknown) => [
    ...Value.Errors(SuccessResponseSchema, payload),
  ];

  it('accepts a valid success response', () => {
    expect(validate({ success: true })).toHaveLength(0);
  });

  it('rejects missing success flag', () => {
    expect(validate({})).not.toHaveLength(0);
  });

  it('rejects non-boolean success values', () => {
    expect(validate({ success: 'yes' })).not.toHaveLength(0);
  });
});
