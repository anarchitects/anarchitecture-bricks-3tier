import { Test, TestingModule } from '@nestjs/testing';
import { TypeormAuthUserRepository } from './typeorm-auth-user.repository';
import { User } from '@anarchitects/auth-ts/models';
import { getRepositoryToken } from '@nestjs/typeorm';
import { UserEntity } from '../entities/user.entity';
import { InvalidatedTokenEntity } from '../entities/invalidated-token.entity';
import { NotFoundException } from '@nestjs/common';

describe('TypeormAuthUserRepository', () => {
  let provider: TypeormAuthUserRepository;
  const mockUser: User = {
    id: 'user-id-123',
    userName: 'testuser',
    email: 'testuser@example.com',
    passwordHash: 'hashedpassword',
    isActive: true,
    roles: [],
    token: 'some-token',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockUserRepository = {
    find: jest.fn().mockResolvedValue([mockUser]),
    findOne: jest.fn().mockResolvedValue(mockUser),
    create: jest.fn().mockReturnValue(mockUser),
    save: jest.fn().mockImplementation(
      async (entity: Partial<User>) =>
        ({
          ...mockUser,
          ...entity,
        }) as User,
    ),
    preload: jest.fn().mockImplementation(
      async (partial: Partial<User>) =>
        ({
          ...mockUser,
          ...partial,
        }) as User,
    ),
    remove: jest.fn().mockResolvedValue(mockUser),
  };
  const mockInvalidatedTokenRepository = {
    create: jest.fn(),
    save: jest.fn(),
    findOne: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TypeormAuthUserRepository,
        {
          provide: getRepositoryToken(UserEntity),
          useValue: mockUserRepository,
        },
        {
          provide: getRepositoryToken(InvalidatedTokenEntity),
          useValue: mockInvalidatedTokenRepository,
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
      expect(users).toEqual([mockUser]);
      expect(mockUserRepository.find).toHaveBeenCalled();
    });
  });
  describe('findOne', () => {
    it('should return a user by conditions', async () => {
      const user = await provider.findOne({ where: { id: 'user-id-123' } });
      expect(user).toEqual(mockUser);
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
        userName: 'newuser',
        email: 'newuser@example.com',
        passwordHash: 'newhashedpassword',
      });
      expect(newUser).toEqual(mockUser);
      expect(mockUserRepository.create).toHaveBeenCalled();
      expect(mockUserRepository.save).toHaveBeenCalledWith(mockUser);
    });
  });
  describe('update', () => {
    it('should update and save an existing user', async () => {
      const updatedUser = await provider.update({
        id: 'user-id-123',
        email: 'updateduser@example.com',
      });
      const mockUpdatedUser = { ...mockUser, ...updatedUser };
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
      expect(deletedUser).toEqual(mockUser);
      expect(mockUserRepository.remove).toHaveBeenCalledWith(mockUser);
    });
  });
  describe('invalidateTokens', () => {
    it('should invalidate tokens', async () => {
      const tokens = ['token1', 'token2'];
      await provider.invalidateTokens(tokens, 'user-id-123');
      expect(mockInvalidatedTokenRepository.create).toHaveBeenCalledTimes(2);
      expect(mockInvalidatedTokenRepository.save).toHaveBeenCalled();
    });
  });
  describe('isTokenInvalidated', () => {
    it('should return true if token is invalidated', async () => {
      mockInvalidatedTokenRepository.findOne.mockResolvedValueOnce({
        tokenId: 'token1',
      });
      const isInvalidated = await provider.isTokenInvalidated('token1');
      expect(isInvalidated).toBe(true);
      expect(mockInvalidatedTokenRepository.findOne).toHaveBeenCalledWith({
        where: { tokenId: 'token1' },
      });
    });
    it('should return false if token is not invalidated', async () => {
      mockInvalidatedTokenRepository.findOne.mockResolvedValueOnce(null);
      const isInvalidated = await provider.isTokenInvalidated('token2');
      expect(isInvalidated).toBe(false);
    });
  });
});
