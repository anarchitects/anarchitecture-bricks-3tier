import { Role } from './role.model';

export type User = {
  id: string;
  email: string;
  userName: string | null;
  passwordHash: string;
  token: string | null;
  isActive: boolean;
  roles: Role[] | null;
  createdAt: Date;
  updatedAt: Date;
};
