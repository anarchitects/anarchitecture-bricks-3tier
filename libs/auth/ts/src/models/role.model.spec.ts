import { expectTypeOf, describe, it } from 'vitest';
import type { Role } from './role.model';
import type { Permission } from './permission.model';
import type { User } from './user.model';

describe('Role model type', () => {
  it('matches the expected structure', () => {
    expectTypeOf<Role>().toEqualTypeOf<{
      id: string;
      name: string;
      description: string | null;
      permissions: Permission[] | null;
      users: User[] | null;
      createdAt: Date;
      updatedAt: Date;
    }>();
  });

  it('relates to permissions and users', () => {
    expectTypeOf<Role>()
      .toHaveProperty('permissions')
      .toMatchTypeOf<Permission[] | null>();

    expectTypeOf<Role>().toHaveProperty('users').toMatchTypeOf<User[] | null>();
  });

  it('uses Date timestamps', () => {
    expectTypeOf<Role>().toHaveProperty('createdAt').toMatchTypeOf<Date>();
    expectTypeOf<Role>().toHaveProperty('updatedAt').toMatchTypeOf<Date>();
  });
});
