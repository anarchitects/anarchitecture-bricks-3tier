export type UserProfile = {
  id: string;
  authUserId: string;
  displayName: string | null;
  givenName: string | null;
  familyName: string | null;
  avatarUrl: string | null;
  locale: string | null;
  timeZone: string | null;
  createdAt: Date;
  updatedAt: Date;
};

export type IdentityProfile = UserProfile;
