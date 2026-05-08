import { Value } from '@sinclair/typebox/value';
import { describe, expect, it } from 'vitest';
import { UserProfileSchema } from './user-profile.dto';

const validUserProfile = {
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
};

describe('UserProfileSchema', () => {
  it('declares the expected required fields', () => {
    expect(UserProfileSchema.required).toStrictEqual([
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

  it('validates a complete user profile payload', () => {
    expect([
      ...Value.Errors(UserProfileSchema, validUserProfile),
    ]).toStrictEqual([]);
  });

  it('allows nullable profile fields', () => {
    expect([
      ...Value.Errors(UserProfileSchema, {
        ...validUserProfile,
        displayName: null,
        givenName: null,
        familyName: null,
        avatarUrl: null,
        locale: null,
        timeZone: null,
      }),
    ]).toStrictEqual([]);
  });

  it('requires authUserId and ISO timestamp strings', () => {
    expect(
      [
        ...Value.Errors(UserProfileSchema, {
          ...validUserProfile,
          authUserId: undefined,
        }),
      ].length,
    ).toBeGreaterThan(0);

    expect(
      [
        ...Value.Errors(UserProfileSchema, {
          ...validUserProfile,
          createdAt: 123,
        }),
      ].length,
    ).toBeGreaterThan(0);
  });
});
