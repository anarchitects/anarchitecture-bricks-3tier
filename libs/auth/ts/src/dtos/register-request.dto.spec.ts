import { Value } from '@sinclair/typebox/value';
import { RegisterRequestSchema } from './register-request.dto';

describe('RegisterRequestSchema', () => {
  const validate = (payload: unknown) => [
    ...Value.Errors(RegisterRequestSchema, payload),
  ];

  const validPayload = {
    email: 'new-user@example.com',
    password: 'secure-password',
    confirmPassword: 'secure-password',
    userName: 'New User',
  };

  it('accepts a valid registration payload', () => {
    expect(validate(validPayload)).toHaveLength(0);
  });

  it('requires email, password, and confirmPassword', () => {
    const missingEmail = { ...validPayload } as Record<string, unknown>;
    delete missingEmail['email'];
    expect(validate(missingEmail)).not.toHaveLength(0);

    const missingPassword = { ...validPayload } as Record<string, unknown>;
    delete missingPassword['password'];
    expect(validate(missingPassword)).not.toHaveLength(0);

    const missingConfirm = { ...validPayload } as Record<string, unknown>;
    delete missingConfirm['confirmPassword'];
    expect(validate(missingConfirm)).not.toHaveLength(0);
  });

  it('allows userName to be omitted but validates length when present', () => {
    const withoutUserName = { ...validPayload } as Record<string, unknown>;
    delete withoutUserName['userName'];
    expect(validate(withoutUserName)).toHaveLength(0);

    expect(validate({ ...validPayload, userName: 'A' })).not.toHaveLength(0);
  });

  it('rejects invalid email format or short passwords', () => {
    expect(
      validate({ ...validPayload, email: 'invalid-email' })
    ).not.toHaveLength(0);
    expect(validate({ ...validPayload, password: '12345' })).not.toHaveLength(
      0
    );
    expect(
      validate({ ...validPayload, confirmPassword: '12345' })
    ).not.toHaveLength(0);
  });
});
