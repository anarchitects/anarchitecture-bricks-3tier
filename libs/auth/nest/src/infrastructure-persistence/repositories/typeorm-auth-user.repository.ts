import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { UserEntity } from '../entities/user.entity';
import { AuthUserRepository } from './auth-user.repository';
import { User } from '@anarchitects/auth-ts/models';
import { InvalidatedTokenEntity } from '../entities/invalidated-token.entity';

@Injectable()
export class TypeormAuthUserRepository implements AuthUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(InvalidatedTokenEntity)
    private readonly invalidatedTokenRepository: Repository<InvalidatedTokenEntity>,
  ) {}
  async find(conditions: FindManyOptions<User> = {}): Promise<User[]> {
    return this.userRepository.find(conditions);
  }
  async findOne(conditions: FindOneOptions<User>): Promise<UserEntity> {
    const user = await this.userRepository.findOne(conditions);
    if (!user) {
      throw new NotFoundException(
        `User with conditions #${JSON.stringify(conditions)} not found`,
      );
    }
    return user;
  }
  async create(user: Partial<User>): Promise<User> {
    const newUser = this.userRepository.create(user);
    return this.userRepository.save(newUser);
  }
  async update(user: Partial<User>): Promise<User> {
    const updatedUser = await this.userRepository.preload(user);
    if (!updatedUser) {
      throw new NotFoundException(`User with id #${user.id} not found`);
    }
    return this.userRepository.save(updatedUser);
  }
  async delete(userId: string): Promise<UserEntity> {
    const user = await this.findOne({ where: { id: userId } });
    return this.userRepository.remove(user);
  }

  async invalidateTokens(
    tokens: string[],
    userId: string | null,
  ): Promise<void> {
    const invalidatedTokens = tokens.map((token) =>
      this.invalidatedTokenRepository.create({
        tokenId: token,
        userId,
      }),
    );
    await this.invalidatedTokenRepository.save(invalidatedTokens);
  }

  async isTokenInvalidated(tokenId: string): Promise<boolean> {
    const token = await this.invalidatedTokenRepository.findOne({
      where: { tokenId },
    });
    return !!token;
  }
}
