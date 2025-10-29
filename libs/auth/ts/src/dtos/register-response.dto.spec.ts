import { Value } from '@sinclair/typebox/value';
import { RegisterResponseSchema } from './register-response.dto';

describe('RegisterResponseSchema', () => {
  const validate = (payload: unknown) => [
    ...Value.Errors(RegisterResponseSchema, payload),
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
