import { Value } from '@sinclair/typebox/value';
import { describe, expect, it } from 'vitest';
import { AuthUserIdParamsSchema } from './auth-user-id-params.dto';

describe('AuthUserIdParamsSchema', () => {
  it('validates a non-empty auth user id param', () => {
    expect([
      ...Value.Errors(AuthUserIdParamsSchema, {
        authUserId: 'auth-user-id',
      }),
    ]).toStrictEqual([]);
  });

  it('rejects blank auth user id params', () => {
    expect(
      [
        ...Value.Errors(AuthUserIdParamsSchema, {
          authUserId: ' ',
        }),
      ].length,
    ).toBeGreaterThan(0);
  });
});
