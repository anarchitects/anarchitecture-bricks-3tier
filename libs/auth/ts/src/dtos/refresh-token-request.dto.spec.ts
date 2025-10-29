import { Value } from '@sinclair/typebox/value';
import { RefreshTokenRequestSchema } from './refresh-token-request.dto';

describe('RefreshTokenRequestSchema', () => {
  const validate = (payload: unknown) => [
    ...Value.Errors(RefreshTokenRequestSchema, payload),
  ];

  it('accepts a valid refresh token payload', () => {
    expect(validate({ refreshToken: 'refresh-token' })).toHaveLength(0);
  });

  it('requires the refreshToken field', () => {
    expect(validate({})).not.toHaveLength(0);
  });

  it('rejects an empty refresh token string', () => {
    expect(validate({ refreshToken: '' })).not.toHaveLength(0);
  });
});
