import { Value } from '@sinclair/typebox/value';
import { LogoutRequestSchema } from './logout-request.dto';

describe('LogoutRequestSchema', () => {
  const validate = (payload: unknown) => [
    ...Value.Errors(LogoutRequestSchema, payload),
  ];

  it('requires refreshToken and allows optional accessToken', () => {
    expect(validate({ refreshToken: 'refresh-token' })).toHaveLength(0);
    expect(
      validate({ refreshToken: 'refresh-token', accessToken: 'access-token' })
    ).toHaveLength(0);
  });

  it('rejects payloads missing refreshToken', () => {
    expect(validate({})).not.toHaveLength(0);
    expect(validate({ accessToken: 'access-token' })).not.toHaveLength(0);
  });

  it('rejects empty strings for provided fields', () => {
    expect(validate({ refreshToken: '' })).not.toHaveLength(0);
    expect(
      validate({ refreshToken: 'refresh-token', accessToken: '' })
    ).not.toHaveLength(0);
  });
});
