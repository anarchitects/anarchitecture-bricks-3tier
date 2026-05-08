import { describe, expectTypeOf, it } from 'vitest';
import type { IdentityProfile, UserProfile } from './user-profile.model';

describe('UserProfile model type', () => {
  it('matches the expected identity profile structure', () => {
    expectTypeOf<UserProfile>().toEqualTypeOf<{
      id: string;
      authUserId: string;
      displayName: string | null;
      givenName: string | null;
      familyName: string | null;
      avatarUrl: string | null;
      locale: string | null;
      timeZone: string | null;
      createdAt: Date;
      updatedAt: Date;
    }>();
  });

  it('uses Date objects for timestamps', () => {
    expectTypeOf<UserProfile>()
      .toHaveProperty('createdAt')
      .toMatchTypeOf<Date>();
    expectTypeOf<UserProfile>()
      .toHaveProperty('updatedAt')
      .toMatchTypeOf<Date>();
  });

  it('keeps IdentityProfile as a compatibility alias', () => {
    expectTypeOf<IdentityProfile>().toEqualTypeOf<UserProfile>();
  });
});
