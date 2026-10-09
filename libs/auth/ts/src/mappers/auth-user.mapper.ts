import { AuthUser } from '../models/auth-user.model.js';
import { fromIsoDateTime, toIsoDateTime } from './date-time.js';
import { PublicUser } from './auth-public.types.js';
import { fromPublicRole, toPublicRole } from './role.mapper.js';

export const toPublicAuthUser = (model: AuthUser): PublicUser => ({
  id: model.id,
  email: model.email,
  name: model.name,
  image: model.image ?? null,
  emailVerified: model.emailVerified,
  roles: model.roles?.map(toPublicRole) ?? null,
  createdAt: toIsoDateTime(model.createdAt, 'createdAt'),
  updatedAt: toIsoDateTime(model.updatedAt, 'updatedAt'),
});

export const fromPublicAuthUser = (dto: PublicUser): AuthUser => ({
  id: dto.id,
  email: dto.email,
  name: dto.name,
  image: dto.image ?? null,
  emailVerified: dto.emailVerified,
  roles: dto.roles?.map((role) => fromPublicRole(role)) ?? null,
  createdAt: fromIsoDateTime(dto.createdAt, 'createdAt'),
  updatedAt: fromIsoDateTime(dto.updatedAt, 'updatedAt'),
});

export const toPublicUser = toPublicAuthUser;
export const fromPublicUser = fromPublicAuthUser;
