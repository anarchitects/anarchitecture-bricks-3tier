import { Value } from '@sinclair/typebox/value';
import { describe, expect, it } from 'vitest';
import { UserProfileIdParamsSchema } from './user-profile-id-params.dto';

describe('UserProfileIdParamsSchema', () => {
  it('validates a non-empty profile id param', () => {
    expect([
      ...Value.Errors(UserProfileIdParamsSchema, {
        profileId: 'profile-id',
      }),
    ]).toStrictEqual([]);
  });

  it('rejects blank profile id params', () => {
    expect(
      [
        ...Value.Errors(UserProfileIdParamsSchema, {
          profileId: ' ',
        }),
      ].length,
    ).toBeGreaterThan(0);
  });
});
