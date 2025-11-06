import { UserEntity } from './user.entity';

describe('UserEntity', () => {
  it('should be defined', () => {
    expect(new UserEntity({})).toBeDefined();
  });
  it('should create a UserEntity with given properties', () => {
    const userProps = {
      id: 'user123',
      userName: 'testuser',
      email: 'testuser@example.com',
      passwordHash: 'hashedpassword',
      isActive: true,
    };
    const userEntity = new UserEntity(userProps);
    expect(userEntity.id).toBe(userProps.id);
    expect(userEntity.userName).toBe(userProps.userName);
    expect(userEntity.email).toBe(userProps.email);
    expect(userEntity.passwordHash).toBe(userProps.passwordHash);
    expect(userEntity.isActive).toBe(userProps.isActive);
  });
});
