import { Permission } from './permission.model';
import { User } from './user.model';

export type Role = {
  id: string;
  name: string;
  description: string | null;
  permissions: Permission[] | null;
  users: User[] | null;
  createdAt: Date;
  updatedAt: Date;
};
