import { Test, TestingModule } from '@nestjs/testing';
import { UserProfilesController } from './user-profiles.controller';
import {
  CreateUserProfileService,
  GetUserProfileService,
  UpdateUserProfileService,
} from '../../application';

describe('UserProfilesController', () => {
  let controller: UserProfilesController;

  const mockProfile = {
    id: 'profile-1',
    authUserId: 'auth-user-1',
    displayName: 'Jane Doe',
    givenName: 'Jane',
    familyName: 'Doe',
    avatarUrl: null,
    locale: 'en-BE',
    timeZone: 'Europe/Brussels',
    createdAt: '2026-05-09T10:00:00.000Z',
    updatedAt: '2026-05-09T11:00:00.000Z',
  };

  const mockCreateUserProfileService = {
    create: jest.fn().mockResolvedValue(mockProfile),
  };

  const mockGetUserProfileService = {
    getById: jest.fn().mockResolvedValue(mockProfile),
    getByAuthUserId: jest.fn().mockResolvedValue(mockProfile),
  };

  const mockUpdateUserProfileService = {
    updateById: jest.fn().mockResolvedValue(mockProfile),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UserProfilesController],
      providers: [
        {
          provide: CreateUserProfileService,
          useValue: mockCreateUserProfileService,
        },
        {
          provide: GetUserProfileService,
          useValue: mockGetUserProfileService,
        },
        {
          provide: UpdateUserProfileService,
          useValue: mockUpdateUserProfileService,
        },
      ],
    }).compile();

    controller = module.get<UserProfilesController>(UserProfilesController);
  });

  it('is defined', () => {
    expect(controller).toBeDefined();
  });

  it('delegates profile creation', async () => {
    const dto = {
      authUserId: 'auth-user-1',
      displayName: 'Jane Doe',
    };

    await expect(controller.createProfile(dto)).resolves.toEqual(mockProfile);
    expect(mockCreateUserProfileService.create).toHaveBeenCalledWith(dto);
  });

  it('delegates lookup by auth user id', async () => {
    await expect(
      controller.getProfileByAuthUserId('auth-user-1'),
    ).resolves.toEqual(mockProfile);
    expect(mockGetUserProfileService.getByAuthUserId).toHaveBeenCalledWith(
      'auth-user-1',
    );
  });

  it('delegates lookup by profile id', async () => {
    await expect(controller.getProfileById('profile-1')).resolves.toEqual(
      mockProfile,
    );
    expect(mockGetUserProfileService.getById).toHaveBeenCalledWith('profile-1');
  });

  it('delegates profile updates', async () => {
    const dto = {
      displayName: 'Jane Example',
    };

    await expect(controller.updateProfile('profile-1', dto)).resolves.toEqual(
      mockProfile,
    );
    expect(mockUpdateUserProfileService.updateById).toHaveBeenCalledWith(
      'profile-1',
      dto,
    );
  });
});
