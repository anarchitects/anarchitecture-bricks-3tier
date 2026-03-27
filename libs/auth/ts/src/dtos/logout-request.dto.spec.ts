import { Value } from '@sinclair/typebox/value';
import { LogoutRequestSchema } from './logout-request.dto';

describe('LogoutRequestSchema', () => {
  const validate = (payload: unknown) => [
    ...Value.Errors(LogoutRequestSchema, payload),
  ];

  it('accepts an empty payload for core session logout', () => {
    expect(validate({})).toHaveLength(0);
  });

  it('rejects additional properties', () => {
    expect(validate({ refreshToken: 'refresh-token' })).not.toHaveLength(0);
    expect(validate({ accessToken: 'access-token' })).not.toHaveLength(0);
  });
});
