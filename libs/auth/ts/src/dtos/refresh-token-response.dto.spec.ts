import { Value } from '@sinclair/typebox/value';
import { RefreshTokenResponseSchema } from './refresh-token-response.dto';

describe('RefreshTokenResponseSchema', () => {
  const validate = (payload: unknown) => [
    ...Value.Errors(RefreshTokenResponseSchema, payload),
  ];

  it('accepts a valid refresh token response payload', () => {
    expect(
      validate({ accessToken: 'access-token', refreshToken: 'refresh-token' })
    ).toHaveLength(0);
  });

  it('requires both tokens to be present', () => {
    expect(validate({ accessToken: 'access-token' })).not.toHaveLength(0);
    expect(validate({ refreshToken: 'refresh-token' })).not.toHaveLength(0);
  });

  it('rejects empty token strings', () => {
    expect(validate({ accessToken: '', refreshToken: '' })).not.toHaveLength(0);
  });
});
