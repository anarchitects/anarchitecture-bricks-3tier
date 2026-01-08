import { PermissionEntity } from './permission.entity';

describe('PermissionEntity', () => {
  it('should be defined', () => {
    expect(new PermissionEntity({})).toBeDefined();
  });
  it('should create a PermissionEntity with given properties', () => {
    const permissionProps = {
      id: 'perm123',
      name: 'read_articles',
      description: 'Permission to read articles',
    };
    const permissionEntity = new PermissionEntity(permissionProps);
    expect(permissionEntity.id).toBe(permissionProps.id);
    expect(permissionEntity.name).toBe(permissionProps.name);
    expect(permissionEntity.description).toBe(permissionProps.description);
  });
});
