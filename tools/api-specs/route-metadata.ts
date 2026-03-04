export const TAG_PREFIX_MAP: Array<{ prefix: string; tag: string }> = [
  { prefix: '/auth', tag: 'Auth' },
  { prefix: '/forms', tag: 'Forms' },
];

export const OPERATION_ID_MAP: Record<string, string> = {
  'PATCH /auth/activate': 'activateUser',
  'PATCH /auth/change-password/{userId}': 'changePassword',
  'POST /auth/forgot-password': 'forgotPassword',
  'POST /auth/login': 'login',
  'POST /auth/logout': 'logout',
  'GET /auth/me': 'getLoggedInUserInfo',
  'POST /auth/refresh-tokens/{userId}': 'refreshTokens',
  'POST /auth/register': 'registerUser',
  'POST /auth/reset-password': 'resetPassword',
  'PATCH /auth/update-email/{userId}': 'updateEmail',
  'POST /auth/verify-email': 'verifyEmail',
  'GET /forms/{formId}': 'getFormDefinition',
  'POST /forms/submit': 'submitForm',
};

export function normalizePath(url: string): string {
  return url.replace(/:([A-Za-z0-9_]+)/g, '{$1}');
}

export function toRouteKey(method: string, path: string): string {
  return `${method.toUpperCase()} ${path}`;
}

export function isManagedOpenApiPath(path: string): boolean {
  return TAG_PREFIX_MAP.some(({ prefix }) => path.startsWith(prefix));
}

export function resolveOperationId(method: string, path: string): string {
  const key = toRouteKey(method, path);
  const operationId = OPERATION_ID_MAP[key];

  if (!operationId) {
    throw new Error(`Missing operationId mapping for route key: ${key}`);
  }

  return operationId;
}

export function resolveTags(path: string): string[] {
  const match = TAG_PREFIX_MAP.find(({ prefix }) => path.startsWith(prefix));
  return match ? [match.tag] : [];
}
