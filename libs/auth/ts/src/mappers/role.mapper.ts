import { Role } from '../models/role.model';
import { User } from '../models/user.model';
import { fromIsoDateTime, toIsoDateTime } from './date-time';
import { PublicRole } from './auth-public.types';
import { fromPublicPermission, toPublicPermission } from './permission.mapper';

export const toPublicRole = (model: Role): PublicRole => ({
  id: model.id,
  name: model.name,
  description: model.description,
  permissions: model.permissions?.map(toPublicPermission) ?? null,
  createdAt: toIsoDateTime(model.createdAt, 'createdAt'),
  updatedAt: toIsoDateTime(model.updatedAt, 'updatedAt'),
});

export const fromPublicRole = (
  dto: PublicRole,
  options?: { users?: User[] | null },
): Role => ({
  id: dto.id,
  name: dto.name,
  description: dto.description,
  permissions: dto.permissions?.map((permission) =>
    fromPublicPermission(permission),
  ) ?? null,
  users: options?.users ?? null,
  createdAt: fromIsoDateTime(dto.createdAt, 'createdAt'),
  updatedAt: fromIsoDateTime(dto.updatedAt, 'updatedAt'),
});
