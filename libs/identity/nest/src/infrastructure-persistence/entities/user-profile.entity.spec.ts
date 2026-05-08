import { UserProfileEntity } from './user-profile.entity';

describe('UserProfileEntity', () => {
  it('creates a profile entity with scalar auth ownership', () => {
    const entity = new UserProfileEntity({
      id: 'profile-id',
      authUserId: 'auth-user-id',
      displayName: 'Jane Doe',
      givenName: 'Jane',
      familyName: 'Doe',
      avatarUrl: null,
      locale: 'en-BE',
      timeZone: 'Europe/Brussels',
    });

    expect(entity.id).toBe('profile-id');
    expect(entity.authUserId).toBe('auth-user-id');
    expect(entity.displayName).toBe('Jane Doe');
    expect(entity.timeZone).toBe('Europe/Brussels');
  });

  it('keeps auth ownership as a scalar field without an inverse relation', () => {
    const entity = new UserProfileEntity();

    expect(entity).not.toHaveProperty('authUser');
    expect(entity).not.toHaveProperty('user');
  });
});
