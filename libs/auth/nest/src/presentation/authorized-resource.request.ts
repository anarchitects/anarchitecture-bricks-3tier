import { Subject } from '@anarchitects/auth-ts/models';

export const AUTHORIZED_RESOURCES_REQUEST_KEY = '__authAuthorizedResources';

type AuthorizedResourceStore = Record<string, unknown>;

type RequestWithAuthorizedResources = Record<string, unknown> & {
  [AUTHORIZED_RESOURCES_REQUEST_KEY]?: AuthorizedResourceStore;
};

export const attachAuthorizedResource = (
  request: Record<string, unknown>,
  subject: Subject,
  resource: unknown,
): void => {
  const requestWithResources = request as RequestWithAuthorizedResources;
  const store =
    requestWithResources[AUTHORIZED_RESOURCES_REQUEST_KEY] ??
    (requestWithResources[AUTHORIZED_RESOURCES_REQUEST_KEY] = {});
  store[subject] = resource;
};

export const getAuthorizedResourceStore = (
  request: Record<string, unknown>,
): AuthorizedResourceStore =>
  (request as RequestWithAuthorizedResources)[
    AUTHORIZED_RESOURCES_REQUEST_KEY
  ] ?? {};

export const getAuthorizedResource = (
  request: Record<string, unknown>,
  subject: Subject,
): unknown => getAuthorizedResourceStore(request)[subject];
