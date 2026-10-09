import { Permission } from './permission.model.js';
import { AuthUser } from './auth-user.model.js';

export type Role = {
  id: string;
  name: string;
  description: string | null;
  permissions: Permission[] | null;
  users: AuthUser[] | null;
  createdAt: Date;
  updatedAt: Date;
};
