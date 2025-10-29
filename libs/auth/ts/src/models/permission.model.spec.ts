import { expectTypeOf, describe, it } from 'vitest';
import type { Permission } from './permission.model';
import type { Role } from './role.model';

describe('Permission model type', () => {
  it('matches the expected structure', () => {
    expectTypeOf<Permission>().toEqualTypeOf<{
      id: string;
      name: string;
      description: string | null;
      action: string;
      subject: string;
      conditions: Record<string, unknown> | null;
      roles: Role[] | null;
      createdAt: Date;
      updatedAt: Date;
    }>();
  });

  it('references related roles', () => {
    expectTypeOf<Permission>()
      .toHaveProperty('roles')
      .toMatchTypeOf<Role[] | null>();
  });

  it('uses Date timestamps', () => {
    expectTypeOf<Permission>()
      .toHaveProperty('createdAt')
      .toMatchTypeOf<Date>();
    expectTypeOf<Permission>()
      .toHaveProperty('updatedAt')
      .toMatchTypeOf<Date>();
  });
});
