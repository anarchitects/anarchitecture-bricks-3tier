import {
  UpdateUserProfileRequestDTO,
  UserProfileResponseDTO,
} from '@anarchitects/identity-ts';
import { Injectable, NotFoundException } from '@nestjs/common';
import {
  toUpdateUserProfileRecord,
  toUserProfileResponseDTO,
} from '../mappers/user-profile.mapper';
import { UserProfilesRepository } from '../ports/user-profiles.repository';

@Injectable()
export class UpdateUserProfileService {
  constructor(
    private readonly userProfilesRepository: UserProfilesRepository,
  ) {}

  async updateById(
    id: string,
    dto: UpdateUserProfileRequestDTO,
  ): Promise<UserProfileResponseDTO> {
    const existingProfile = await this.userProfilesRepository.findById(id);
    if (!existingProfile) {
      throw new NotFoundException(`User profile with id #${id} not found`);
    }

    const updatedProfile = await this.userProfilesRepository.update(
      toUpdateUserProfileRecord(existingProfile.id, dto),
    );

    return toUserProfileResponseDTO(updatedProfile);
  }

  async updateByAuthUserId(
    authUserId: string,
    dto: UpdateUserProfileRequestDTO,
  ): Promise<UserProfileResponseDTO> {
    const existingProfile =
      await this.userProfilesRepository.findByAuthUserId(authUserId);
    if (!existingProfile) {
      throw new NotFoundException(
        `User profile for auth user #${authUserId} not found`,
      );
    }

    const updatedProfile = await this.userProfilesRepository.update(
      toUpdateUserProfileRecord(existingProfile.id, dto),
    );

    return toUserProfileResponseDTO(updatedProfile);
  }
}
