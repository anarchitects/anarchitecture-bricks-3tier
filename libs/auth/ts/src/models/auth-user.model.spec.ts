import { expectTypeOf, describe, it } from 'vitest';
import type { AuthUser, User } from './auth-user.model';
import type { Role } from './role.model';

describe('AuthUser model type', () => {
  it('matches the expected structure', () => {
    expectTypeOf<AuthUser>().toEqualTypeOf<{
      id: string;
      email: string;
      name: string | null;
      image?: string | null;
      emailVerified: boolean;
      roles: Role[] | null;
      createdAt: Date;
      updatedAt: Date;
    }>();
  });

  it('exposes roles as an array of Role or null', () => {
    expectTypeOf<AuthUser>()
      .toHaveProperty('roles')
      .toMatchTypeOf<Role[] | null>();
  });

  it('uses Date objects for timestamps', () => {
    expectTypeOf<AuthUser>().toHaveProperty('createdAt').toMatchTypeOf<Date>();
    expectTypeOf<AuthUser>().toHaveProperty('updatedAt').toMatchTypeOf<Date>();
  });

  it('keeps User as a compatibility alias', () => {
    expectTypeOf<User>().toEqualTypeOf<AuthUser>();
  });
});
