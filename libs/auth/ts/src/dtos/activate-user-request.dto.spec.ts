import { Value } from '@sinclair/typebox/value';
import { ActivateUserRequestSchema } from './activate-user-request.dto';

describe('ActivateUserRequestSchema', () => {
  const validate = (payload: unknown) => [
    ...Value.Errors(ActivateUserRequestSchema, payload),
  ];

  it('accepts a valid activation payload', () => {
    expect(validate({ token: 'activate-token' })).toHaveLength(0);
  });

  it('requires the token field', () => {
    expect(validate({})).not.toHaveLength(0);
  });

  it('rejects an empty token string', () => {
    expect(validate({ token: '' })).not.toHaveLength(0);
  });
});
