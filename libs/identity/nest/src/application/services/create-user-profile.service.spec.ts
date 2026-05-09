import { BadRequestException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserProfile } from '@anarchitects/identity-ts/models';
import { UserProfilesRepository } from '../ports/user-profiles.repository';
import { CreateUserProfileService } from './create-user-profile.service';

describe('CreateUserProfileService', () => {
  let service: CreateUserProfileService;

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
    findByAuthUserId: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockUserProfilesRepository.findByAuthUserId.mockResolvedValue(null);
    mockUserProfilesRepository.save.mockResolvedValue(mockProfile);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CreateUserProfileService,
        {
          provide: UserProfilesRepository,
          useValue: mockUserProfilesRepository,
        },
      ],
    }).compile();

    service = module.get<CreateUserProfileService>(CreateUserProfileService);
  });

  it('creates a new profile when the auth user does not own one yet', async () => {
    await expect(
      service.create({
        authUserId: 'auth-user-1',
        displayName: 'Jane Doe',
        locale: null,
      }),
    ).resolves.toEqual({
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
    expect(mockUserProfilesRepository.save).toHaveBeenCalledWith({
      authUserId: 'auth-user-1',
      displayName: 'Jane Doe',
      locale: null,
    });
  });

  it('rejects duplicate profiles for the same auth user', async () => {
    mockUserProfilesRepository.findByAuthUserId.mockResolvedValueOnce(
      mockProfile,
    );

    await expect(
      service.create({
        authUserId: 'auth-user-1',
      }),
    ).rejects.toThrow(
      new BadRequestException(
        'User profile already exists for auth user #auth-user-1',
      ),
    );
    expect(mockUserProfilesRepository.save).not.toHaveBeenCalled();
  });
});
