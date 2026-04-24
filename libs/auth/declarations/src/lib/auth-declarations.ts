import { applyDecorators, SetMetadata } from '@nestjs/common';
import type { RoutePolicy } from '@anarchitects/auth-ts/models';

export const AUTH_PUBLIC_METADATA_KEY = 'auth:public';
export const POLICIES_KEY = 'policies';
export const AUTHORIZE_RESOURCE_KEY = 'authorize-resource';

export type { RoutePolicy };

export type AuthPermissionRequirement = RoutePolicy;

export type ResourceAuthorizationRoute = RoutePolicy &
  Readonly<{
    idParam: string;
  }>;

export type AuthResourceAccessRequirement = ResourceAuthorizationRoute;

export const Public = () => SetMetadata(AUTH_PUBLIC_METADATA_KEY, true);

export const Policies = (...rules: RoutePolicy[]) =>
  applyDecorators(SetMetadata(POLICIES_KEY, rules));

export const AuthorizeResource = (...resources: ResourceAuthorizationRoute[]) =>
  applyDecorators(SetMetadata(AUTHORIZE_RESOURCE_KEY, resources));

export const RequirePermissions = (
  ...permissions: AuthPermissionRequirement[]
) => Policies(...permissions);

export const RequireResourceAccess = (
  ...resources: AuthResourceAccessRequirement[]
) => AuthorizeResource(...resources);
