import {
  CreateUserProfileRequestDTO,
  UserProfileResponseDTO,
} from '@anarchitects/identity-ts';
import { BadRequestException, Injectable } from '@nestjs/common';
import { UserProfilesRepository } from '../ports/user-profiles.repository';
import {
  toCreateUserProfileRecord,
  toUserProfileResponseDTO,
} from '../mappers/user-profile.mapper';

@Injectable()
export class CreateUserProfileService {
  constructor(
    private readonly userProfilesRepository: UserProfilesRepository,
  ) {}

  async create(
    dto: CreateUserProfileRequestDTO,
  ): Promise<UserProfileResponseDTO> {
    const existingProfile = await this.userProfilesRepository.findByAuthUserId(
      dto.authUserId,
    );
    if (existingProfile) {
      throw new BadRequestException(
        `User profile already exists for auth user #${dto.authUserId}`,
      );
    }

    const profile = await this.userProfilesRepository.save(
      toCreateUserProfileRecord(dto),
    );

    return toUserProfileResponseDTO(profile);
  }
}
