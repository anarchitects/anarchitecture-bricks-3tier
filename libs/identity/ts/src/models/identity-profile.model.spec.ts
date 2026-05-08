import type { IdentityProfile } from './identity-profile.model';

describe('IdentityProfile', () => {
  it('should allow a minimal identity profile shape', () => {
    const profile: IdentityProfile = {
      id: 'identity-profile-id',
    };

    expect(profile.id).toBe('identity-profile-id');
  });
});
