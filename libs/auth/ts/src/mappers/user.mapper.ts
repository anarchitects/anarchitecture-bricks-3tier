import { User } from '../models/user.model';
import { fromIsoDateTime, toIsoDateTime } from './date-time';
import { PublicUser } from './auth-public.types';
import { fromPublicRole, toPublicRole } from './role.mapper';

export const toPublicUser = (model: User): PublicUser => ({
  id: model.id,
  email: model.email,
  userName: model.userName,
  isActive: model.isActive,
  roles: model.roles?.map(toPublicRole) ?? null,
  createdAt: toIsoDateTime(model.createdAt, 'createdAt'),
  updatedAt: toIsoDateTime(model.updatedAt, 'updatedAt'),
});

export const fromPublicUser = (
  dto: PublicUser,
  options: { passwordHash: string; token?: string | null },
): User => ({
  id: dto.id,
  email: dto.email,
  userName: dto.userName,
  passwordHash: options.passwordHash,
  token: options.token ?? null,
  isActive: dto.isActive,
  roles: dto.roles?.map((role) => fromPublicRole(role)) ?? null,
  createdAt: fromIsoDateTime(dto.createdAt, 'createdAt'),
  updatedAt: fromIsoDateTime(dto.updatedAt, 'updatedAt'),
});
