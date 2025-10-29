import { Value } from '@sinclair/typebox/value';
import { UpdateEmailRequestSchema } from './update-email-request.dto';

describe('UpdateEmailRequestSchema', () => {
  const validate = (payload: unknown) => [
    ...Value.Errors(UpdateEmailRequestSchema, payload),
  ];

  it('accepts a valid update email payload', () => {
    expect(
      validate({ newEmail: 'new@example.com', password: 'current-password' })
    ).toHaveLength(0);
  });

  it('allows the password to be omitted', () => {
    expect(validate({ newEmail: 'new@example.com' })).toHaveLength(0);
  });

  it('rejects invalid emails or too-short passwords', () => {
    expect(validate({ newEmail: 'invalid-email' })).not.toHaveLength(0);
    expect(
      validate({ newEmail: 'new@example.com', password: '12345' })
    ).not.toHaveLength(0);
  });
});
