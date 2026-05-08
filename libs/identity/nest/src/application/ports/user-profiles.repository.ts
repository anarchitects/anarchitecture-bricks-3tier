import { Injectable } from '@nestjs/common';
import { UserProfile } from '@anarchitects/identity-ts/models';

type UserProfileMutableFields = Pick<
  UserProfile,
  | 'displayName'
  | 'givenName'
  | 'familyName'
  | 'avatarUrl'
  | 'locale'
  | 'timeZone'
>;

export type CreateUserProfileRecord = {
  id?: string;
  authUserId: string;
} & Partial<UserProfileMutableFields>;

export type UpdateUserProfileRecord = {
  id: string;
} & Partial<UserProfileMutableFields>;

@Injectable()
export abstract class UserProfilesRepository {
  abstract findById(id: string): Promise<UserProfile | null>;
  abstract findByAuthUserId(authUserId: string): Promise<UserProfile | null>;
  abstract save(profile: CreateUserProfileRecord): Promise<UserProfile>;
  abstract update(profile: UpdateUserProfileRecord): Promise<UserProfile>;
}
