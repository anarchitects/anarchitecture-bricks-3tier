import { authOperations } from '@anarchitects/auth-contracts';
import { formsOperations } from '@anarchitects/forms-contracts';
import { identityOperations } from '@anarchitects/identity-contracts';
import { newsletterOperations } from '@anarchitects/newsletter-contracts';

export const canonicalOperations = [
  ...authOperations,
  ...formsOperations,
  ...identityOperations,
  ...newsletterOperations,
];

const operationsByRoute = new Map(
  canonicalOperations.map((operation) => [
    `${operation.method} ${operation.path}`,
    operation,
  ]),
);
if (operationsByRoute.size !== canonicalOperations.length) {
  throw new Error('Canonical contracts contain duplicate route keys');
}

export function normalizePath(url: string): string {
  return url.replace(/:([A-Za-z0-9_]+)/g, '{$1}');
}

export function toRouteKey(method: string, path: string): string {
  return `${method.toUpperCase()} ${normalizePath(path)}`;
}

export function isManagedOpenApiPath(path: string): boolean {
  return canonicalOperations.some(
    ({ domain }) => path === `/${domain}` || path.startsWith(`/${domain}/`),
  );
}

function resolveOperation(method: string, path: string) {
  const key = toRouteKey(method, path);
  const operation = operationsByRoute.get(key);
  if (!operation) {
    throw new Error(`Route absent from pinned canonical contracts: ${key}`);
  }
  return operation;
}

export function resolveOperationId(method: string, path: string): string {
  return resolveOperation(method, path).operationId;
}

export function resolveTags(method: string, path: string): string[] {
  return [...resolveOperation(method, path).tags];
}
