import { expectTypeOf, describe, it } from 'vitest';
import type { User } from './user.model';
import type { Role } from './role.model';

describe('User model type', () => {
  it('matches the expected structure', () => {
    expectTypeOf<User>().toEqualTypeOf<{
      id: string;
      email: string;
      userName: string | null;
      passwordHash: string;
      token: string | null;
      isActive: boolean;
      roles: Role[] | null;
      createdAt: Date;
      updatedAt: Date;
    }>();
  });

  it('exposes roles as an array of Role or null', () => {
    expectTypeOf<User>().toHaveProperty('roles').toMatchTypeOf<Role[] | null>();
  });

  it('uses Date objects for timestamps', () => {
    expectTypeOf<User>().toHaveProperty('createdAt').toMatchTypeOf<Date>();
    expectTypeOf<User>().toHaveProperty('updatedAt').toMatchTypeOf<Date>();
  });
});
