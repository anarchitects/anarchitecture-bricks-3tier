import { Value } from '@sinclair/typebox/value';
import { LogoutRequestSchema } from './logout-request.dto';

describe('LogoutRequestSchema', () => {
  const validate = (payload: unknown) => [
    ...Value.Errors(LogoutRequestSchema, payload),
  ];

  it('accepts an empty payload because fields are optional', () => {
    expect(validate({})).toHaveLength(0);
  });

  it('accepts payloads with either optional field', () => {
    expect(validate({ refreshToken: 'refresh-token' })).toHaveLength(0);
    expect(validate({ sessionId: 'session-123' })).toHaveLength(0);
  });

  it('rejects empty strings for optional fields when present', () => {
    expect(validate({ refreshToken: '' })).not.toHaveLength(0);
    expect(validate({ sessionId: '' })).not.toHaveLength(0);
  });
});
