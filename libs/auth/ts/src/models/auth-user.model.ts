import { Role } from './role.model.js';

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  image?: string | null;
  emailVerified: boolean;
  roles: Role[] | null;
  createdAt: Date;
  updatedAt: Date;
};

export type User = AuthUser;
