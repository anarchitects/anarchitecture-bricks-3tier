import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { User } from '@anarchitects/auth-ts/models';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { AuthUserRepository } from '../../application/ports/auth-user.repository';
import { RoleEntity } from '../entities/role.entity';
import { UserEntity } from '../entities/user.entity';

@Injectable()
export class TypeormAuthUserRepository implements AuthUserRepository {
  constructor(
    @InjectRepository(UserEntity)
    private readonly userRepository: Repository<UserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
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
  async ensureRole(userId: string, roleName: string): Promise<void> {
    let role = await this.roleRepository.findOne({ where: { name: roleName } });
    if (!role) {
      role = await this.roleRepository.save(
        this.roleRepository.create({
          name: roleName,
          description: null,
          permissions: null,
          users: null,
        }),
      );
    }

    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles'],
    });
    if (!user) {
      throw new NotFoundException(`User with id #${userId} not found`);
    }

    if (user.roles?.some((existingRole) => existingRole.name === roleName)) {
      return;
    }

    user.roles = [...(user.roles ?? []), role];
    await this.userRepository.save(user);
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
}
