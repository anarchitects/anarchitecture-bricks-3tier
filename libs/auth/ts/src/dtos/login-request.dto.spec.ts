import { Value } from '@sinclair/typebox/value';
import { LoginRequestSchema } from './login-request.dto';

describe('LoginRequestSchema', () => {
  const validate = (payload: unknown) => [
    ...Value.Errors(LoginRequestSchema, payload),
  ];

  const validPayload = {
    credential: 'user@example.com',
    password: 'secret123',
  };

  it('accepts a valid login payload', () => {
    expect(validate(validPayload)).toHaveLength(0);
  });

  it('requires both credential and password', () => {
    expect(validate({ password: 'secret123' })).not.toHaveLength(0);
    expect(validate({ credential: 'user@example.com' })).not.toHaveLength(0);
  });

  it('enforces credential and password length constraints', () => {
    expect(validate({ ...validPayload, credential: 'a' })).not.toHaveLength(0);
    expect(validate({ ...validPayload, password: 'short' })).not.toHaveLength(
      0
    );
  });
});
