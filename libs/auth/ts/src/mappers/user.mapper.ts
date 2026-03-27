import { User } from '../models/user.model';
import { fromIsoDateTime, toIsoDateTime } from './date-time';
import { PublicUser } from './auth-public.types';
import { fromPublicRole, toPublicRole } from './role.mapper';

export const toPublicUser = (model: User): PublicUser => ({
  id: model.id,
  email: model.email,
  name: model.name,
  image: model.image ?? null,
  emailVerified: model.emailVerified,
  roles: model.roles?.map(toPublicRole) ?? null,
  createdAt: toIsoDateTime(model.createdAt, 'createdAt'),
  updatedAt: toIsoDateTime(model.updatedAt, 'updatedAt'),
});

export const fromPublicUser = (
  dto: PublicUser,
): User => ({
  id: dto.id,
  email: dto.email,
  name: dto.name,
  image: dto.image ?? null,
  emailVerified: dto.emailVerified,
  roles: dto.roles?.map((role) => fromPublicRole(role)) ?? null,
  createdAt: fromIsoDateTime(dto.createdAt, 'createdAt'),
  updatedAt: fromIsoDateTime(dto.updatedAt, 'updatedAt'),
});
