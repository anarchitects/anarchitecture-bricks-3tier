import { Action, AuthUser, Subject } from '@anarchitects/auth-ts/models';

export type AuthorizableResource = Record<string, unknown>;

export type ResourceAuthorizationLoaderInput = {
  user: AuthUser;
  resourceId: string;
};

export type ResourceAuthorizationLoader<
  TResource extends AuthorizableResource = AuthorizableResource,
> = (
  input: ResourceAuthorizationLoaderInput,
) => Promise<TResource | null> | TResource | null;

export type ResourceAuthorizationLoaders = Record<
  string,
  ResourceAuthorizationLoader
>;

export type ResourceAuthorizationOptions = {
  loaders?: ResourceAuthorizationLoaders;
};

export type ResourceAuthorizationRoute = {
  action: Action;
  subject: Subject;
  idParam: string;
};
