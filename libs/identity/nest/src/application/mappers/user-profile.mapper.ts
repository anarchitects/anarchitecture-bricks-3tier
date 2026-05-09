import {
  CreateUserProfileRequestDTO,
  UpdateUserProfileRequestDTO,
  UserProfileResponseDTO,
} from '@anarchitects/identity-ts';
import { UserProfile } from '@anarchitects/identity-ts/models';
import {
  CreateUserProfileRecord,
  UpdateUserProfileRecord,
} from '../ports/user-profiles.repository';

const USER_PROFILE_MUTABLE_FIELDS = [
  'displayName',
  'givenName',
  'familyName',
  'avatarUrl',
  'locale',
  'timeZone',
] as const;

type UserProfileMutableField = (typeof USER_PROFILE_MUTABLE_FIELDS)[number];
type UserProfileMutableValues = Partial<
  Record<UserProfileMutableField, string | null | undefined>
>;

const pickDefinedMutableFields = (
  input: UserProfileMutableValues,
): Partial<Record<UserProfileMutableField, string | null>> => {
  const output: Partial<Record<UserProfileMutableField, string | null>> = {};

  for (const field of USER_PROFILE_MUTABLE_FIELDS) {
    const value = input[field];
    if (value !== undefined) {
      output[field] = value;
    }
  }

  return output;
};

export const toCreateUserProfileRecord = (
  dto: CreateUserProfileRequestDTO,
): CreateUserProfileRecord => ({
  authUserId: dto.authUserId,
  ...pickDefinedMutableFields(dto),
});

export const toUpdateUserProfileRecord = (
  id: string,
  dto: UpdateUserProfileRequestDTO,
): UpdateUserProfileRecord => ({
  id,
  ...pickDefinedMutableFields(dto),
});

export const toUserProfileResponseDTO = (
  profile: UserProfile,
): UserProfileResponseDTO => ({
  id: profile.id,
  authUserId: profile.authUserId,
  displayName: profile.displayName,
  givenName: profile.givenName,
  familyName: profile.familyName,
  avatarUrl: profile.avatarUrl,
  locale: profile.locale,
  timeZone: profile.timeZone,
  createdAt: profile.createdAt.toISOString(),
  updatedAt: profile.updatedAt.toISOString(),
});
