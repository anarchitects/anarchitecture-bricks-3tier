import { UserEntity } from './user.entity';

describe('UserEntity', () => {
  it('should be defined', () => {
    expect(new UserEntity({})).toBeDefined();
  });
  it('should create a UserEntity with given properties', () => {
    const userProps = {
      id: 'user123',
      name: 'testuser',
      email: 'testuser@example.com',
      emailVerified: true,
      image: null,
    };
    const userEntity = new UserEntity(userProps);
    expect(userEntity.id).toBe(userProps.id);
    expect(userEntity.name).toBe(userProps.name);
    expect(userEntity.email).toBe(userProps.email);
    expect(userEntity.emailVerified).toBe(userProps.emailVerified);
    expect(userEntity.image).toBeNull();
  });
});
