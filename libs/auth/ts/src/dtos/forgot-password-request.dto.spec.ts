import { Value } from '@sinclair/typebox/value';
import { ForgotPasswordRequestSchema } from './forgot-password-request.dto';

describe('ForgotPasswordRequestSchema', () => {
  const validate = (payload: unknown) => [
    ...Value.Errors(ForgotPasswordRequestSchema, payload),
  ];

  it('accepts a valid email payload', () => {
    expect(validate({ email: 'user@example.com' })).toHaveLength(0);
  });

  it('rejects missing email', () => {
    expect(validate({})).not.toHaveLength(0);
  });

  it('rejects an invalid email format', () => {
    expect(validate({ email: 'not-an-email' })).not.toHaveLength(0);
  });
});
