import { Value } from '@sinclair/typebox/value';
import { LoggedInUserInfoResponseSchema } from './logged-in-user-info-response.dto';

describe('LoggedInUserInfoResponseSchema', () => {
  const validate = (payload: unknown) => [
    ...Value.Errors(LoggedInUserInfoResponseSchema, payload),
  ];

  it('accepts user info response with unknown user and RBAC entries', () => {
    expect(
      validate({
        user: { id: 'user-id-123', email: 'test@example.com' },
        rbac: [{ action: 'read', subject: 'all' }],
      })
    ).toHaveLength(0);
  });

  it('requires user and rbac properties', () => {
    expect(validate({})).not.toHaveLength(0);
  });

  it('requires rbac to be an array', () => {
    expect(
      validate({
        user: { id: 'user-id-123' },
        rbac: { action: 'read', subject: 'all' },
      })
    ).not.toHaveLength(0);
  });
});
