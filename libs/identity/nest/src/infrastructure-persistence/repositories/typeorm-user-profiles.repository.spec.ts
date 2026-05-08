import { NotFoundException } from '@nestjs/common';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Test, TestingModule } from '@nestjs/testing';
import { UserProfile } from '@anarchitects/identity-ts/models';
import { TypeormUserProfilesRepository } from './typeorm-user-profiles.repository';
import { UserProfileEntity } from '../entities/user-profile.entity';

describe('TypeormUserProfilesRepository', () => {
  let provider: TypeormUserProfilesRepository;

  const mockUserProfile = {
    id: 'profile-id',
    authUserId: 'auth-user-id',
    displayName: 'Jane Doe',
    givenName: 'Jane',
    familyName: 'Doe',
    avatarUrl: null,
    locale: 'en-BE',
    timeZone: 'Europe/Brussels',
    createdAt: new Date(),
    updatedAt: new Date(),
  } satisfies UserProfile;

  const mockRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
    preload: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();
    mockRepository.findOne.mockResolvedValue(mockUserProfile);
    mockRepository.create.mockReturnValue(mockUserProfile);
    mockRepository.save.mockResolvedValue(mockUserProfile);
    mockRepository.preload.mockResolvedValue(mockUserProfile);

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeormUserProfilesRepository,
        {
          provide: getRepositoryToken(UserProfileEntity),
          useValue: mockRepository,
        },
      ],
    }).compile();

    provider = module.get<TypeormUserProfilesRepository>(
      TypeormUserProfilesRepository,
    );
  });

  it('finds a profile by id', async () => {
    await expect(provider.findById('profile-id')).resolves.toEqual(
      mockUserProfile,
    );
    expect(mockRepository.findOne).toHaveBeenCalledWith({
      where: { id: 'profile-id' },
    });
  });

  it('finds a profile by auth user id', async () => {
    await expect(provider.findByAuthUserId('auth-user-id')).resolves.toEqual(
      mockUserProfile,
    );
    expect(mockRepository.findOne).toHaveBeenCalledWith({
      where: { authUserId: 'auth-user-id' },
    });
  });

  it('creates and saves a profile with nullable defaults', async () => {
    await expect(
      provider.save({
        authUserId: 'auth-user-id',
        displayName: 'Jane Doe',
      }),
    ).resolves.toEqual(mockUserProfile);

    expect(mockRepository.create).toHaveBeenCalledWith({
      id: undefined,
      authUserId: 'auth-user-id',
      displayName: 'Jane Doe',
      givenName: null,
      familyName: null,
      avatarUrl: null,
      locale: null,
      timeZone: null,
    });
  });

  it('updates and saves an existing profile', async () => {
    await expect(
      provider.update({
        id: 'profile-id',
        displayName: 'Updated Name',
      }),
    ).resolves.toEqual(mockUserProfile);

    expect(mockRepository.preload).toHaveBeenCalledWith({
      id: 'profile-id',
      displayName: 'Updated Name',
    });
  });

  it('throws when updating an unknown profile', async () => {
    mockRepository.preload.mockResolvedValueOnce(null);

    await expect(
      provider.update({
        id: 'missing-profile',
        displayName: 'Updated Name',
      }),
    ).rejects.toThrow(NotFoundException);
  });
});
