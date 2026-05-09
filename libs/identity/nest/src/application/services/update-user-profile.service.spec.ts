import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserProfile } from '@anarchitects/identity-ts/models';
import { UserProfilesRepository } from '../ports/user-profiles.repository';
import { UpdateUserProfileService } from './update-user-profile.service';

describe('UpdateUserProfileService', () => {
  let service: UpdateUserProfileService;

  const existingProfile: UserProfile = {
    id: 'profile-1',
    authUserId: 'auth-user-1',
    displayName: 'Jane Doe',
    givenName: 'Jane',
    familyName: 'Doe',
    avatarUrl: null,
    locale: 'en-BE',
    timeZone: 'Europe/Brussels',
    createdAt: new Date('2026-01-01T12:00:00.000Z'),
    updatedAt: new Date('2026-01-02T12:00:00.000Z'),
  };

  const updatedProfile: UserProfile = {
    ...existingProfile,
    displayName: 'Jane Example',
    locale: null,
    updatedAt: new Date('2026-01-03T09:15:00.000Z'),
  };

  const mockUserProfilesRepository = {
    findById: jest.fn(),
    findByAuthUserId: jest.fn(),
    update: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockUserProfilesRepository.findById.mockResolvedValue(existingProfile);
    mockUserProfilesRepository.findByAuthUserId.mockResolvedValue(
      existingProfile,
    );
    mockUserProfilesRepository.update.mockResolvedValue(updatedProfile);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UpdateUserProfileService,
        {
          provide: UserProfilesRepository,
          useValue: mockUserProfilesRepository,
        },
      ],
    }).compile();

    service = module.get<UpdateUserProfileService>(UpdateUserProfileService);
  });

  it('updates a profile by id without mutating immutable ownership fields', async () => {
    await expect(
      service.updateById('profile-1', {
        displayName: 'Jane Example',
        locale: null,
      }),
    ).resolves.toEqual({
      id: 'profile-1',
      authUserId: 'auth-user-1',
      displayName: 'Jane Example',
      givenName: 'Jane',
      familyName: 'Doe',
      avatarUrl: null,
      locale: null,
      timeZone: 'Europe/Brussels',
      createdAt: '2026-01-01T12:00:00.000Z',
      updatedAt: '2026-01-03T09:15:00.000Z',
    });

    expect(mockUserProfilesRepository.findById).toHaveBeenCalledWith(
      'profile-1',
    );
    expect(mockUserProfilesRepository.update).toHaveBeenCalledWith({
      id: 'profile-1',
      displayName: 'Jane Example',
      locale: null,
    });
  });

  it('updates a profile by auth user id', async () => {
    mockUserProfilesRepository.update.mockResolvedValueOnce({
      ...updatedProfile,
      timeZone: 'UTC',
    });

    await expect(
      service.updateByAuthUserId('auth-user-1', {
        timeZone: 'UTC',
      }),
    ).resolves.toEqual({
      id: 'profile-1',
      authUserId: 'auth-user-1',
      displayName: 'Jane Example',
      givenName: 'Jane',
      familyName: 'Doe',
      avatarUrl: null,
      locale: null,
      timeZone: 'UTC',
      createdAt: '2026-01-01T12:00:00.000Z',
      updatedAt: '2026-01-03T09:15:00.000Z',
    });

    expect(mockUserProfilesRepository.findByAuthUserId).toHaveBeenCalledWith(
      'auth-user-1',
    );
    expect(mockUserProfilesRepository.update).toHaveBeenCalledWith({
      id: 'profile-1',
      timeZone: 'UTC',
    });
  });

  it('throws when updating an unknown profile id', async () => {
    mockUserProfilesRepository.findById.mockResolvedValueOnce(null);

    await expect(
      service.updateById('missing-profile', { displayName: 'Updated' }),
    ).rejects.toThrow(
      new NotFoundException('User profile with id #missing-profile not found'),
    );
    expect(mockUserProfilesRepository.update).not.toHaveBeenCalled();
  });

  it('throws when updating an auth user without a profile', async () => {
    mockUserProfilesRepository.findByAuthUserId.mockResolvedValueOnce(null);

    await expect(
      service.updateByAuthUserId('missing-auth-user', {
        displayName: 'Updated',
      }),
    ).rejects.toThrow(
      new NotFoundException(
        'User profile for auth user #missing-auth-user not found',
      ),
    );
  });
});
