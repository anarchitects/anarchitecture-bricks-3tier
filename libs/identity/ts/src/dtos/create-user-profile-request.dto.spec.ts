import { Value } from '@sinclair/typebox/value';
import { describe, expect, it } from 'vitest';
import { CreateUserProfileRequestSchema } from './create-user-profile-request.dto';

describe('CreateUserProfileRequestSchema', () => {
  it('requires authUserId for profile creation', () => {
    expect(CreateUserProfileRequestSchema.required).toStrictEqual([
      'authUserId',
    ]);
  });

  it('validates a minimal create profile payload', () => {
    expect([
      ...Value.Errors(CreateUserProfileRequestSchema, {
        authUserId: 'auth-user-id',
      }),
    ]).toStrictEqual([]);
  });

  it('allows optional nullable profile fields', () => {
    expect([
      ...Value.Errors(CreateUserProfileRequestSchema, {
        authUserId: 'auth-user-id',
        displayName: null,
        givenName: 'Jane',
        familyName: 'Doe',
        avatarUrl: 'https://example.com/avatar.png',
        locale: 'en-BE',
        timeZone: 'Europe/Brussels',
      }),
    ]).toStrictEqual([]);
  });

  it('rejects create payloads without authUserId', () => {
    expect(
      [...Value.Errors(CreateUserProfileRequestSchema, {})].length,
    ).toBeGreaterThan(0);
  });
});
