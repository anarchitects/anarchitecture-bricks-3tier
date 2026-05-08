import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  CreateUserProfileRecord,
  UpdateUserProfileRecord,
  UserProfilesRepository,
} from '../../application/ports/user-profiles.repository';
import { UserProfileEntity } from '../entities/user-profile.entity';

const toCreatePersistenceInput = (
  profile: CreateUserProfileRecord,
): Partial<UserProfileEntity> => ({
  id: profile.id,
  authUserId: profile.authUserId,
  displayName: profile.displayName ?? null,
  givenName: profile.givenName ?? null,
  familyName: profile.familyName ?? null,
  avatarUrl: profile.avatarUrl ?? null,
  locale: profile.locale ?? null,
  timeZone: profile.timeZone ?? null,
});

@Injectable()
export class TypeormUserProfilesRepository implements UserProfilesRepository {
  constructor(
    @InjectRepository(UserProfileEntity)
    private readonly repo: Repository<UserProfileEntity>,
  ) {}

  async findById(id: string): Promise<UserProfileEntity | null> {
    return this.repo.findOne({ where: { id } });
  }

  async findByAuthUserId(
    authUserId: string,
  ): Promise<UserProfileEntity | null> {
    return this.repo.findOne({ where: { authUserId } });
  }

  async save(profile: CreateUserProfileRecord): Promise<UserProfileEntity> {
    const entity = this.repo.create(toCreatePersistenceInput(profile));
    return this.repo.save(entity);
  }

  async update(profile: UpdateUserProfileRecord): Promise<UserProfileEntity> {
    const existingProfile = await this.repo.preload(profile);
    if (!existingProfile) {
      throw new NotFoundException(
        `User profile with id #${profile.id} not found`,
      );
    }

    return this.repo.save(existingProfile);
  }
}
