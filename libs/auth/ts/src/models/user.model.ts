import { Role } from './role.model';

export type User = {
  id: string;
  email: string;
  name: string | null;
  image?: string | null;
  emailVerified: boolean;
  roles: Role[] | null;
  createdAt: Date;
  updatedAt: Date;
};
