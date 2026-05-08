import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthUser } from '@anarchitects/auth-ts/models';
import { FindManyOptions, FindOneOptions, Repository } from 'typeorm';
import { AuthUserRepository } from '../../application/ports/auth-user.repository';
import { AuthUserEntity } from '../entities/auth-user.entity';
import { RoleEntity } from '../entities/role.entity';

@Injectable()
export class TypeormAuthUserRepository implements AuthUserRepository {
  constructor(
    @InjectRepository(AuthUserEntity)
    private readonly userRepository: Repository<AuthUserEntity>,
    @InjectRepository(RoleEntity)
    private readonly roleRepository: Repository<RoleEntity>,
  ) {}
  async find(conditions: FindManyOptions<AuthUser> = {}): Promise<AuthUser[]> {
    return this.userRepository.find(conditions);
  }
  async findOne(conditions: FindOneOptions<AuthUser>): Promise<AuthUserEntity> {
    const authUser = await this.userRepository.findOne(conditions);
    if (!authUser) {
      throw new NotFoundException(
        `User with conditions #${JSON.stringify(conditions)} not found`,
      );
    }
    return authUser;
  }
  async create(authUser: Partial<AuthUser>): Promise<AuthUser> {
    const newAuthUser = this.userRepository.create(authUser);
    return this.userRepository.save(newAuthUser);
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

    const authUser = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['roles'],
    });
    if (!authUser) {
      throw new NotFoundException(`User with id #${userId} not found`);
    }

    if (
      authUser.roles?.some((existingRole) => existingRole.name === roleName)
    ) {
      return;
    }

    authUser.roles = [...(authUser.roles ?? []), role];
    await this.userRepository.save(authUser);
  }
  async update(authUser: Partial<AuthUser>): Promise<AuthUser> {
    const updatedAuthUser = await this.userRepository.preload(authUser);
    if (!updatedAuthUser) {
      throw new NotFoundException(`User with id #${authUser.id} not found`);
    }
    return this.userRepository.save(updatedAuthUser);
  }
  async delete(userId: string): Promise<AuthUserEntity> {
    const user = await this.findOne({ where: { id: userId } });
    return this.userRepository.remove(user);
  }
}
