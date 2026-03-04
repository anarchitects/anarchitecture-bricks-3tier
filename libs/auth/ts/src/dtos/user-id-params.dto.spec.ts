import { Value } from '@sinclair/typebox/value';
import { UserIdParamsSchema } from './user-id-params.dto';

describe('UserIdParamsSchema', () => {
  const validate = (payload: unknown) => [
    ...Value.Errors(UserIdParamsSchema, payload),
  ];

  it('accepts valid route params', () => {
    expect(validate({ userId: 'user-id-123' })).toHaveLength(0);
  });

  it('requires userId', () => {
    expect(validate({})).not.toHaveLength(0);
  });

  it('rejects non-string userId', () => {
    expect(validate({ userId: 123 })).not.toHaveLength(0);
  });
});
