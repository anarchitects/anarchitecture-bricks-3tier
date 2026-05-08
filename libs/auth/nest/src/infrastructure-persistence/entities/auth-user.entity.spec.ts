import { AuthUserEntity, UserEntity } from './auth-user.entity';

describe('AuthUserEntity', () => {
  it('should be defined', () => {
    expect(new AuthUserEntity({})).toBeDefined();
  });
  it('should create an AuthUserEntity with given properties', () => {
    const userProps = {
      id: 'user123',
      name: 'testuser',
      email: 'testuser@example.com',
      emailVerified: true,
      image: null,
    };
    const userEntity = new AuthUserEntity(userProps);
    expect(userEntity.id).toBe(userProps.id);
    expect(userEntity.name).toBe(userProps.name);
    expect(userEntity.email).toBe(userProps.email);
    expect(userEntity.emailVerified).toBe(userProps.emailVerified);
    expect(userEntity.image).toBeNull();
  });

  it('keeps UserEntity as a compatibility alias', () => {
    expect(UserEntity).toBe(AuthUserEntity);
  });
});
