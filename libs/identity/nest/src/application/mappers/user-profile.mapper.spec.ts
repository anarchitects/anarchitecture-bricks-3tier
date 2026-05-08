import {
  CreateUserProfileRequestDTO,
  UpdateUserProfileRequestDTO,
} from '@anarchitects/identity-ts';
import { UserProfile } from '@anarchitects/identity-ts/models';
import {
  toCreateUserProfileRecord,
  toUpdateUserProfileRecord,
  toUserProfileResponseDTO,
} from './user-profile.mapper';

describe('user-profile.mapper', () => {
  it('maps create dto fields into a repository create record', () => {
    const dto: CreateUserProfileRequestDTO = {
      authUserId: 'auth-user-1',
      displayName: 'Jane Doe',
      locale: null,
    };

    expect(toCreateUserProfileRecord(dto)).toEqual({
      authUserId: 'auth-user-1',
      displayName: 'Jane Doe',
      locale: null,
    });
  });

  it('maps update dto fields into a repository update record without undefined keys', () => {
    const dto: UpdateUserProfileRequestDTO = {
      displayName: null,
      timeZone: 'Europe/Brussels',
    };

    expect(toUpdateUserProfileRecord('profile-1', dto)).toEqual({
      id: 'profile-1',
      displayName: null,
      timeZone: 'Europe/Brussels',
    });
  });

  it('serializes a user profile into the shared response dto shape', () => {
    const createdAt = new Date('2026-01-01T12:00:00.000Z');
    const updatedAt = new Date('2026-01-02T15:30:00.000Z');
    const profile: UserProfile = {
      id: 'profile-1',
      authUserId: 'auth-user-1',
      displayName: 'Jane Doe',
      givenName: 'Jane',
      familyName: 'Doe',
      avatarUrl: null,
      locale: 'en-BE',
      timeZone: 'Europe/Brussels',
      createdAt,
      updatedAt,
    };

    expect(toUserProfileResponseDTO(profile)).toEqual({
      id: 'profile-1',
      authUserId: 'auth-user-1',
      displayName: 'Jane Doe',
      givenName: 'Jane',
      familyName: 'Doe',
      avatarUrl: null,
      locale: 'en-BE',
      timeZone: 'Europe/Brussels',
      createdAt: createdAt.toISOString(),
      updatedAt: updatedAt.toISOString(),
    });
  });
});
