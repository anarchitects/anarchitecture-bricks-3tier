import { Test, TestingModule } from '@nestjs/testing';
import { TypeormAuthUserRepository } from './typeorm-auth-user.repository';
import { AuthUser } from '@anarchitects/auth-ts/models';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AuthUserEntity } from '../entities/auth-user.entity';
import { RoleEntity } from '../entities/role.entity';
import { NotFoundException } from '@nestjs/common';

describe('TypeormAuthUserRepository', () => {
  let provider: TypeormAuthUserRepository;
  const mockAuthUser: AuthUser = {
    id: 'user-id-123',
    name: 'testuser',
    email: 'testuser@example.com',
    emailVerified: true,
    image: null,
    roles: [],
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserRepository = {
    find: jest.fn().mockResolvedValue([mockAuthUser]),
    findOne: jest.fn().mockResolvedValue(mockAuthUser),
    create: jest.fn().mockReturnValue(mockAuthUser),
    save: jest.fn().mockImplementation(
      async (entity: Partial<AuthUser>) =>
        ({
          ...mockAuthUser,
          ...entity,
        }) as AuthUser,
    ),
    preload: jest.fn().mockImplementation(
      async (partial: Partial<AuthUser>) =>
        ({
          ...mockAuthUser,
          ...partial,
        }) as AuthUser,
    ),
    remove: jest.fn().mockResolvedValue(mockAuthUser),
  };
  const mockRoleRepository = {
    findOne: jest.fn(),
    create: jest.fn(),
    save: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeormAuthUserRepository,
        {
          provide: getRepositoryToken(AuthUserEntity),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(RoleEntity),
          useValue: mockRoleRepository,
        },
      ],
    }).compile();

    provider = module.get<TypeormAuthUserRepository>(TypeormAuthUserRepository);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
  describe('find', () => {
    it('should return an array of users', async () => {
      const users = await provider.find();
      expect(users).toEqual([mockAuthUser]);
      expect(mockUserRepository.find).toHaveBeenCalled();
    });
  });
  describe('findOne', () => {
    it('should return a user by conditions', async () => {
      const user = await provider.findOne({ where: { id: 'user-id-123' } });
      expect(user).toEqual(mockAuthUser);
      expect(mockUserRepository.findOne).toHaveBeenCalledWith({
        where: { id: 'user-id-123' },
      });
    });
    it('should throw NotFoundException if user not found', async () => {
      mockUserRepository.findOne.mockResolvedValueOnce(null);
      try {
        await provider.findOne({ where: { id: 'non-existent-id' } });
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
      }
    });
  });
  describe('create', () => {
    it('should create and save a new user', async () => {
      const newUser = await provider.create({
        name: 'newuser',
        email: 'newuser@example.com',
        image: null,
      });
      expect(newUser).toEqual(mockAuthUser);
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(mockUserRepository.save).toHaveBeenCalledWith(mockAuthUser);
    });
  });
  describe('ensureRole', () => {
    it('adds the role to the user when it is missing', async () => {
      const role = {
        id: 'role-id',
        name: 'user',
      };
      mockRoleRepository.findOne.mockResolvedValueOnce(role);
      mockUserRepository.findOne.mockResolvedValueOnce({
        ...mockAuthUser,
        roles: [],
      });

      await provider.ensureRole('user-id-123', 'user');

      expect(mockUserRepository.save).toHaveBeenCalledWith({
        ...mockAuthUser,
        roles: [role],
      });
    });

    it('creates the role when it does not exist yet', async () => {
      const createdRole = { id: 'role-id', name: 'user' };
      mockRoleRepository.findOne.mockResolvedValueOnce(null);
      mockRoleRepository.create.mockReturnValue(createdRole);
      mockRoleRepository.save.mockResolvedValueOnce(createdRole);
      mockUserRepository.findOne.mockResolvedValueOnce({
        ...mockAuthUser,
        roles: [],
      });

      await provider.ensureRole('user-id-123', 'user');

      expect(mockRoleRepository.create).toHaveBeenCalledWith({
        name: 'user',
        description: null,
        permissions: null,
        users: null,
      });
    });
  });
  describe('update', () => {
    it('should update and save an existing user', async () => {
      const updatedUser = await provider.update({
        id: 'user-id-123',
        email: 'updateduser@example.com',
      });
      const mockUpdatedUser = { ...mockAuthUser, ...updatedUser };
      expect(updatedUser).toEqual(mockUpdatedUser);
      expect(mockUserRepository.preload).toHaveBeenCalledWith({
        id: 'user-id-123',
        email: 'updateduser@example.com',
      });
    });
    it('should throw NotFoundException if user to update not found', async () => {
      mockUserRepository.preload.mockResolvedValueOnce(null);
      try {
        await provider.update({
          id: 'non-existent-id',
          email: 'updateduser@example.com',
        });
      } catch (error) {
        expect(error).toBeInstanceOf(NotFoundException);
      }
    });
  });
  describe('delete', () => {
    it('should delete an existing user', async () => {
      const deletedUser = await provider.delete('user-id-123');
      expect(deletedUser).toEqual(mockAuthUser);
      expect(mockUserRepository.remove).toHaveBeenCalledWith(mockAuthUser);
    });
  });
});
