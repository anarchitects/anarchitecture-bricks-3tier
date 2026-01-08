import { Value } from '@sinclair/typebox/value';
import { ResetPasswordRequestSchema } from './reset-password-request.dto';

describe('ResetPasswordRequestSchema', () => {
  const validate = (payload: unknown) => [
    ...Value.Errors(ResetPasswordRequestSchema, payload),
  ];

  const validPayload = {
    token: 'reset-token',
    password: 'new-password',
    confirmPassword: 'new-password',
  };

  it('accepts a valid reset password payload', () => {
    expect(validate(validPayload)).toHaveLength(0);
  });

  it('requires token, password, and confirmPassword', () => {
    const missingToken = { ...validPayload } as Record<string, unknown>;
    delete missingToken['token'];
    expect(validate(missingToken)).not.toHaveLength(0);

    const missingPassword = { ...validPayload } as Record<string, unknown>;
    delete missingPassword['password'];
    expect(validate(missingPassword)).not.toHaveLength(0);

    const missingConfirm = { ...validPayload } as Record<string, unknown>;
    delete missingConfirm['confirmPassword'];
    expect(validate(missingConfirm)).not.toHaveLength(0);
  });

  it('enforces password minimum length', () => {
    expect(
      validate({ ...validPayload, password: 'short', confirmPassword: 'short' })
    ).not.toHaveLength(0);
  });

  it('rejects an empty token string', () => {
    expect(validate({ ...validPayload, token: '' })).not.toHaveLength(0);
  });
});
