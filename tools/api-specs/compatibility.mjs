import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { expand, json } from './canonical-artifacts.mjs';

export function gitJson(ref, path) {
  // Invalid revisions, missing history and oversized output must fail closed.
  return JSON.parse(
    execFileSync('git', ['show', `${ref}:${path}`], {
      encoding: 'utf8',
      maxBuffer: 32 * 1024 * 1024,
      stdio: ['ignore', 'pipe', 'pipe'],
    }),
  );
}

export function wireOperations(document, domain) {
  return Object.fromEntries(
    Object.entries(document.paths)
      .filter(([path]) => !domain || path.startsWith(`/${domain}/`))
      .flatMap(([path, methods]) =>
        Object.entries(methods)
          .filter(([method]) =>
            /^(get|post|patch|put|delete|head|options)$/.test(method),
          )
          .map(([method, operation]) => [
            `${method.toUpperCase()} ${path}`,
            expand(
              {
                operationId: operation.operationId,
                tags: operation.tags,
                parameters: operation.parameters ?? [],
                requestBody: operation.requestBody ?? {},
                responses: operation.responses ?? {},
                security: operation.security ?? [],
              },
              document,
            ),
          ]),
      ),
  );
}

export function implementationChanges(before, after, artifacts) {
  const previous = wireOperations(before),
    current = wireOperations(after);
  const canonical = new Map(
    artifacts.flatMap(({ inventory }) =>
      inventory.operations.map((operation) => [
        `${operation.method} ${operation.path}`,
        operation.definition,
      ]),
    ),
  );
  const changes = [];
  for (const [route, operation] of Object.entries(previous)) {
    if (json(operation) !== json(current[route]))
      changes.push({
        route,
        impact: 'review-required',
        reason: current[route]
          ? 'Existing implementation wire description changed'
          : 'Implementation operation removed',
      });
  }
  for (const [route, operation] of Object.entries(current)) {
    if (previous[route]) continue;
    const published = canonical.get(route);
    assert.ok(
      published &&
        published.operationId === operation.operationId &&
        json(published.tags) === json(operation.tags),
      `New operation absent from pinned canonical inventory: ${route}`,
    );
    changes.push({
      route,
      impact: 'canonical-operation-added',
      reason:
        'New implementation documentation for a published operation; HTTP evidence remains required',
    });
  }
  return changes;
}

export function assertCompatibilityReview(review, fingerprint) {
  const text = (key) =>
    typeof review?.[key] === 'string' && review[key].trim().length > 0;
  assert.ok(
    review?.status === 'approved' &&
      review?.fingerprint === fingerprint &&
      text('owner') &&
      text('decision') &&
      review.decision.startsWith('https://github.com/anarchitects/') &&
      text('migration') &&
      text('rollback'),
    'Wire changes require an exact human-approved compatibility review, including decision, owner, migration and rollback',
  );
}
