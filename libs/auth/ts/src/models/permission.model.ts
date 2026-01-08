import { Role } from './role.model';

export type Permission = {
  id: string;
  name: string;
  description: string | null;
  action: string;
  subject: string;
  conditions: Record<string, unknown> | null;
  fields: string[] | null;
  inverted: boolean;
  reason: string | null;
  roles: Role[] | null;
  createdAt: Date;
  updatedAt: Date;
};
