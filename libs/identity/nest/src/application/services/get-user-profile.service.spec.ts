import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserProfile } from '@anarchitects/identity-ts/models';
import { UserProfilesRepository } from '../ports/user-profiles.repository';
import { GetUserProfileService } from './get-user-profile.service';

describe('GetUserProfileService', () => {
  let service: GetUserProfileService;

  const mockProfile: UserProfile = {
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

  const mockUserProfilesRepository = {
    findById: jest.fn(),
    findByAuthUserId: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockUserProfilesRepository.findById.mockResolvedValue(mockProfile);
    mockUserProfilesRepository.findByAuthUserId.mockResolvedValue(mockProfile);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        GetUserProfileService,
        {
          provide: UserProfilesRepository,
          useValue: mockUserProfilesRepository,
        },
      ],
    }).compile();

    service = module.get<GetUserProfileService>(GetUserProfileService);
  });

  it('gets a profile by id', async () => {
    await expect(service.getById('profile-1')).resolves.toEqual({
      id: 'profile-1',
      authUserId: 'auth-user-1',
      displayName: 'Jane Doe',
      givenName: 'Jane',
      familyName: 'Doe',
      avatarUrl: null,
      locale: 'en-BE',
      timeZone: 'Europe/Brussels',
      createdAt: '2026-01-01T12:00:00.000Z',
      updatedAt: '2026-01-02T12:00:00.000Z',
    });
    expect(mockUserProfilesRepository.findById).toHaveBeenCalledWith(
      'profile-1',
    );
  });

  it('gets a profile by auth user id', async () => {
    await expect(service.getByAuthUserId('auth-user-1')).resolves.toEqual({
      id: 'profile-1',
      authUserId: 'auth-user-1',
      displayName: 'Jane Doe',
      givenName: 'Jane',
      familyName: 'Doe',
      avatarUrl: null,
      locale: 'en-BE',
      timeZone: 'Europe/Brussels',
      createdAt: '2026-01-01T12:00:00.000Z',
      updatedAt: '2026-01-02T12:00:00.000Z',
    });
    expect(mockUserProfilesRepository.findByAuthUserId).toHaveBeenCalledWith(
      'auth-user-1',
    );
  });

  it('throws when the profile id is unknown', async () => {
    mockUserProfilesRepository.findById.mockResolvedValueOnce(null);

    await expect(service.getById('missing-profile')).rejects.toThrow(
      new NotFoundException('User profile with id #missing-profile not found'),
    );
  });

  it('throws when the auth user does not own a profile', async () => {
    mockUserProfilesRepository.findByAuthUserId.mockResolvedValueOnce(null);

    await expect(service.getByAuthUserId('missing-auth-user')).rejects.toThrow(
      new NotFoundException(
        'User profile for auth user #missing-auth-user not found',
      ),
    );
  });
});
