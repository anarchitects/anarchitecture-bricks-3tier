import { Permission } from './permission.model';
import { AuthUser } from './auth-user.model';

export type Role = {
  id: string;
  name: string;
  description: string | null;
  permissions: Permission[] | null;
  users: AuthUser[] | null;
  createdAt: Date;
  updatedAt: Date;
};
