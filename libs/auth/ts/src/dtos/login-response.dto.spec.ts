import { Value } from '@sinclair/typebox/value';
import { LoginResponseSchema } from './login-response.dto';

describe('LoginResponseSchema', () => {
  const validate = (payload: unknown) => [
    ...Value.Errors(LoginResponseSchema, payload),
  ];

  it('accepts a valid login response payload', () => {
    expect(
      validate({ accessToken: 'access-token', refreshToken: 'refresh-token' })
    ).toHaveLength(0);
  });

  it('requires both accessToken and refreshToken', () => {
    expect(validate({ accessToken: 'access-token' })).not.toHaveLength(0);
    expect(validate({ refreshToken: 'refresh-token' })).not.toHaveLength(0);
  });

  it('rejects empty token strings', () => {
    expect(validate({ accessToken: '', refreshToken: '' })).not.toHaveLength(0);
  });
});
