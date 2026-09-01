import { TestBed } from '@angular/core/testing';
import { IdentityApi } from '@anarchitects/identity-angular/data-access';
import type {
  UpdateUserProfileRequestDTO,
  UserProfileResponseDTO,
} from '@anarchitects/identity-ts';
import { of, Subject, throwError } from 'rxjs';
import { provideIdentityState } from './identity-state.provider';
import { IdentityStore } from './identity.store';

const profile: UserProfileResponseDTO = {
  id: 'profile-1',
  authUserId: 'auth-user-1',
  displayName: 'Ada Lovelace',
  givenName: 'Ada',
  familyName: 'Lovelace',
  avatarUrl: null,
  locale: 'en-GB',
  timeZone: 'Europe/London',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

describe('IdentityStore', () => {
  const api = {
    getProfileByAuthUserId: vi.fn(),
    updateProfile: vi.fn(),
  };
  let store: IdentityStore;

  beforeEach(() => {
    api.getProfileByAuthUserId.mockReset();
    api.updateProfile.mockReset();

    TestBed.configureTestingModule({
      providers: [
        { provide: IdentityApi, useValue: api },
        ...provideIdentityState(),
      ],
    });

    store = TestBed.inject(IdentityStore);
  });

  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should expose loading state and the loaded profile', async () => {
    const response = new Subject<UserProfileResponseDTO>();
    api.getProfileByAuthUserId.mockReturnValue(response);

    const result = store.loadProfile('auth-user-1');

    expect(store.loading()).toBe(true);
    expect(store.error()).toBeNull();

    response.next(profile);
    response.complete();

    await expect(result).resolves.toEqual(profile);
    expect(api.getProfileByAuthUserId).toHaveBeenCalledWith('auth-user-1');
    expect(store.loading()).toBe(false);
    expect(store.profile()).toEqual(profile);
    expect(store.hasProfile()).toBe(true);
  });

  it('should expose a load failure and clear stale profile state', async () => {
    api.getProfileByAuthUserId
      .mockReturnValueOnce(of(profile))
      .mockReturnValueOnce(throwError(() => new Error('Profile unavailable')));

    await store.loadProfile('auth-user-1');
    await expect(store.loadProfile('auth-user-2')).resolves.toBeUndefined();

    expect(store.loading()).toBe(false);
    expect(store.profile()).toBeNull();
    expect(store.error()).toBe('Profile unavailable');
  });

  it('should update the loaded profile and expose saving state', async () => {
    api.getProfileByAuthUserId.mockReturnValue(of(profile));
    await store.loadProfile('auth-user-1');

    const response = new Subject<UserProfileResponseDTO>();
    api.updateProfile.mockReturnValue(response);
    const dto: UpdateUserProfileRequestDTO = {
      displayName: 'Countess of Lovelace',
    };

    const result = store.updateProfile(dto);
    expect(store.saving()).toBe(true);

    const updated = { ...profile, ...dto };
    response.next(updated);
    response.complete();

    await expect(result).resolves.toEqual(updated);
    expect(api.updateProfile).toHaveBeenCalledWith('profile-1', dto);
    expect(store.saving()).toBe(false);
    expect(store.profile()).toEqual(updated);
  });

  it('should expose an update failure without discarding the loaded profile', async () => {
    api.getProfileByAuthUserId.mockReturnValue(of(profile));
    api.updateProfile.mockReturnValue(
      throwError(() => new Error('Profile update failed')),
    );
    await store.loadProfile('auth-user-1');

    await expect(
      store.updateProfile({ displayName: 'Countess of Lovelace' }),
    ).resolves.toBeUndefined();

    expect(store.saving()).toBe(false);
    expect(store.profile()).toEqual(profile);
    expect(store.error()).toBe('Profile update failed');
  });

  it('should reject an update before a profile has loaded', async () => {
    await expect(
      store.updateProfile({ displayName: 'Ada' }),
    ).resolves.toBeUndefined();

    expect(api.updateProfile).not.toHaveBeenCalled();
    expect(store.error()).toBe('Load a profile before updating it.');
  });
});
