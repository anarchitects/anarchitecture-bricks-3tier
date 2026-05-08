import { Value } from '@sinclair/typebox/value';
import { describe, expect, it } from 'vitest';
import { UserProfileResponseSchema } from './user-profile-response.dto';

describe('UserProfileResponseSchema', () => {
  it('reuses the canonical user profile DTO schema', () => {
    expect(UserProfileResponseSchema.required).toStrictEqual([
      'id',
      'authUserId',
      'displayName',
      'givenName',
      'familyName',
      'avatarUrl',
      'locale',
      'timeZone',
      'createdAt',
      'updatedAt',
    ]);
  });

  it('validates a serialized user profile response', () => {
    expect([
      ...Value.Errors(UserProfileResponseSchema, {
        id: 'profile-id',
        authUserId: 'auth-user-id',
        displayName: 'Jane Doe',
        givenName: 'Jane',
        familyName: 'Doe',
        avatarUrl: 'https://example.com/avatar.png',
        locale: 'en-BE',
        timeZone: 'Europe/Brussels',
        createdAt: '2026-05-08T12:00:00.000Z',
        updatedAt: '2026-05-08T12:00:00.000Z',
      }),
    ]).toStrictEqual([]);
  });
});
