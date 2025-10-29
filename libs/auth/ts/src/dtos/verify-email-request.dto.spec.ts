import { Value } from '@sinclair/typebox/value';
import { VerifyEmailRequestSchema } from './verify-email-request.dto';

describe('VerifyEmailRequestSchema', () => {
  const validate = (payload: unknown) => [
    ...Value.Errors(VerifyEmailRequestSchema, payload),
  ];

  it('accepts a valid verify email payload', () => {
    expect(validate({ token: 'verify-token' })).toHaveLength(0);
  });

  it('requires the token field', () => {
    expect(validate({})).not.toHaveLength(0);
  });

  it('rejects an empty token string', () => {
    expect(validate({ token: '' })).not.toHaveLength(0);
  });
});
