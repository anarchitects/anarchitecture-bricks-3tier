import { RoleEntity } from './role.entity';

describe('RoleEntity', () => {
  it('should be defined', () => {
    expect(new RoleEntity({})).toBeDefined();
  });
  it('should create a RoleEntity with given properties', () => {
    const roleProps = {
      id: 'role123',
      name: 'admin',
      description: 'Administrator role',
    };
    const roleEntity = new RoleEntity(roleProps);
    expect(roleEntity.id).toBe(roleProps.id);
    expect(roleEntity.name).toBe(roleProps.name);
    expect(roleEntity.description).toBe(roleProps.description);
  });
});
