import { Value } from '@sinclair/typebox/value';
import { ChangePasswordRequestSchema } from './change-password-request.dto';

describe('ChangePasswordRequestSchema', () => {
  const validate = (payload: unknown) => [
    ...Value.Errors(ChangePasswordRequestSchema, payload),
  ];

  const validPayload = {
    currentPassword: 'current-pass',
    newPassword: 'new-password',
    confirmPassword: 'new-password',
  };

  it('accepts a valid change password payload', () => {
    expect(validate(validPayload)).toHaveLength(0);
  });

  it('enforces minimum length for passwords', () => {
    expect(
      validate({
        ...validPayload,
        newPassword: 'short',
        confirmPassword: 'short',
      })
    ).not.toHaveLength(0);

    expect(
      validate({ ...validPayload, currentPassword: '123' })
    ).not.toHaveLength(0);
  });

  it('marks each password field as required', () => {
    const withoutCurrent = { ...validPayload } as Record<string, unknown>;
    delete withoutCurrent['currentPassword'];
    expect(validate(withoutCurrent)).not.toHaveLength(0);

    const withoutNew = { ...validPayload } as Record<string, unknown>;
    delete withoutNew['newPassword'];
    expect(validate(withoutNew)).not.toHaveLength(0);

    const withoutConfirm = { ...validPayload } as Record<string, unknown>;
    delete withoutConfirm['confirmPassword'];
    expect(validate(withoutConfirm)).not.toHaveLength(0);
  });
});
