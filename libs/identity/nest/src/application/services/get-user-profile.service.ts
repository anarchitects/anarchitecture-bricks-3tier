import { UserProfileResponseDTO } from '@anarchitects/identity-ts';
import { Injectable, NotFoundException } from '@nestjs/common';
import { toUserProfileResponseDTO } from '../mappers/user-profile.mapper';
import { UserProfilesRepository } from '../ports/user-profiles.repository';

@Injectable()
export class GetUserProfileService {
  constructor(
    private readonly userProfilesRepository: UserProfilesRepository,
  ) {}

  async getById(id: string): Promise<UserProfileResponseDTO> {
    const profile = await this.userProfilesRepository.findById(id);
    if (!profile) {
      throw new NotFoundException(`User profile with id #${id} not found`);
    }

    return toUserProfileResponseDTO(profile);
  }

  async getByAuthUserId(authUserId: string): Promise<UserProfileResponseDTO> {
    const profile =
      await this.userProfilesRepository.findByAuthUserId(authUserId);
    if (!profile) {
      throw new NotFoundException(
        `User profile for auth user #${authUserId} not found`,
      );
    }

    return toUserProfileResponseDTO(profile);
  }
}
