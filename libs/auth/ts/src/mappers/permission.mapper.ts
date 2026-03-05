import { Permission } from '../models/permission.model';
import { Role } from '../models/role.model';
import { fromIsoDateTime, toIsoDateTime } from './date-time';
import { PublicPermission } from './auth-public.types';

const cloneConditions = (
  conditions: Record<string, unknown> | null,
): Record<string, unknown> | null => (conditions ? { ...conditions } : null);

const cloneFields = (fields: string[] | null): string[] | null =>
  fields ? [...fields] : null;

export const toPublicPermission = (model: Permission): PublicPermission => ({
  id: model.id,
  name: model.name,
  description: model.description,
  action: model.action,
  subject: model.subject,
  conditions: cloneConditions(model.conditions),
  fields: cloneFields(model.fields),
  inverted: model.inverted,
  reason: model.reason,
  createdAt: toIsoDateTime(model.createdAt, 'createdAt'),
  updatedAt: toIsoDateTime(model.updatedAt, 'updatedAt'),
});

export const fromPublicPermission = (
  dto: PublicPermission,
  options?: { roles?: Role[] | null },
): Permission => ({
  id: dto.id,
  name: dto.name,
  description: dto.description,
  action: dto.action,
  subject: dto.subject,
  conditions: cloneConditions(dto.conditions),
  fields: cloneFields(dto.fields),
  inverted: dto.inverted,
  reason: dto.reason,
  roles: options?.roles ?? null,
  createdAt: fromIsoDateTime(dto.createdAt, 'createdAt'),
  updatedAt: fromIsoDateTime(dto.updatedAt, 'updatedAt'),
});
