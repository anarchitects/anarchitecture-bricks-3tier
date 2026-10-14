import assert from 'node:assert/strict';
import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
export const domains = ['auth', 'forms', 'identity', 'newsletter'];
export const digest = (value) =>
  createHash('sha256').update(value).digest('hex');
export const readJson = (path) => JSON.parse(readFileSync(path, 'utf8'));
export function stable(value) {
  if (Array.isArray(value)) return value.map(stable);
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .sort(([a], [b]) => a.localeCompare(b, 'en'))
        .map(([key, item]) => [key, stable(item)]),
    );
  }
  return value;
}
export const json = (value) => JSON.stringify(stable(value));

export function loadCanonicalArtifacts() {
  const root = readJson('package.json');
  return domains.map((domain) => {
    const name = `@anarchitects/${domain}-contracts`;
    const version = root.dependencies[name];
    assert.match(
      version,
      /^\d+\.\d+\.\d+$/,
      `${name}: an exact published version is required`,
    );
    const manifest = readJson(require.resolve(`${name}/manifest.json`));
    assert.equal(
      manifest.packages[name],
      version,
      `${name}: installed artifact differs from the root pin`,
    );
    assert.equal(manifest.artifactKind, 'canonical-contract');
    assert.equal(manifest.contractPublication.status, 'validated');
    const files = {};
    for (const file of [`${domain}-canonical.json`, 'inventory.json']) {
      const bytes = readFileSync(require.resolve(`${name}/openapi/${file}`));
      assert.equal(
        digest(bytes),
        manifest.artifacts[file],
        `${name}/${file}: integrity mismatch`,
      );
      files[file] = JSON.parse(bytes);
    }
    const document = files[`${domain}-canonical.json`];
    const inventory = files['inventory.json'];
    assert.match(
      document.openapi,
      /^3\.1\.\d+$/,
      `${name}: unsupported OpenAPI dialect`,
    );
    assert.equal(inventory.operations.length, manifest.operationCount);
    // The inventory includes protected operations intentionally omitted from paths.
    for (const operation of inventory.operations) {
      const published =
        document.paths[operation.path]?.[operation.method.toLowerCase()];
      if (published) {
        const { security, ...definition } = published;
        assert.equal(
          json(definition),
          json(operation.definition),
          `${name}: published operation differs from inventory`,
        );
        assert.equal(
          json(security),
          json([]),
          `${name}: default public operation must not invent a host binding`,
        );
      } else
        assert.ok(
          manifest.excludedOperations.some(
            (entry) => entry.operationId === operation.definition.operationId,
          ),
          `${name}: unexplained missing operation`,
        );
    }
    return { domain, name, version, manifest, document, inventory };
  });
}

export function compareOperationInventory(implementation, artifacts) {
  const errors = [];
  const expected = new Map(
    artifacts.flatMap(({ inventory }) =>
      inventory.operations.map((operation) => [
        `${operation.method} ${operation.path}`,
        operation.definition,
      ]),
    ),
  );
  const actual = new Map(
    Object.entries(implementation.paths ?? {}).flatMap(([path, methods]) =>
      Object.entries(methods)
        .filter(([method]) =>
          /^(get|post|put|patch|delete|head|options)$/.test(method),
        )
        .map(([method, definition]) => [
          `${method.toUpperCase()} ${path}`,
          definition,
        ]),
    ),
  );
  for (const [key, definition] of expected) {
    const current = actual.get(key);
    if (!current) {
      errors.push(`Missing canonical route: ${key}`);
      continue;
    }
    if (current.operationId !== definition.operationId)
      errors.push(`Noncanonical operationId: ${key}`);
    if (json(current.tags) !== json(definition.tags))
      errors.push(`Noncanonical tags: ${key}`);
    for (const [status, response] of Object.entries(definition.responses)) {
      if (
        response['x-contract-outcome'] === 'success' &&
        !current.responses?.[status]
      )
        errors.push(`Missing canonical success status ${status}: ${key}`);
    }
  }
  for (const key of actual.keys())
    if (!expected.has(key))
      errors.push(`Route absent from canonical inventory: ${key}`);
  return errors;
}

// This is a diagnostic comparison, not JSON Schema language-inclusion proof.
// Preserve every constraint; resolve local references without converting 3.1 to 3.0.
export function expand(value, document, visited = new Set()) {
  if (Array.isArray(value))
    return value.map((item) => expand(item, document, visited));
  if (!value || typeof value !== 'object') return value;
  if (value.$ref) {
    assert.ok(
      value.$ref.startsWith('#/'),
      `External reference is not pinned: ${value.$ref}`,
    );
    // A recursive leaf retains its local identity; its target is expanded at
    // the first occurrence, so changes to the recursive definition stay visible.
    if (visited.has(value.$ref)) return value;
    const target = value.$ref
      .slice(2)
      .split('/')
      .reduce(
        (node, key) => node?.[key.replace(/~1/g, '/').replace(/~0/g, '~')],
        document,
      );
    assert.notEqual(target, undefined, `Unresolved reference: ${value.$ref}`);
    const next = new Set([...visited, value.$ref]);
    const siblings = { ...value };
    delete siblings.$ref;
    const expanded = expand(target, document, next);
    return Object.keys(siblings).length
      ? { allOf: [expanded, expand(siblings, document, visited)] }
      : expanded;
  }
  return Object.fromEntries(
    Object.entries(value)
      .filter(
        ([key]) =>
          !(
            ['description', 'title', '$schema', '$id'].includes(key) &&
            typeof value[key] === 'string'
          ),
      )
      .map(([key, item]) => [key, expand(item, document, visited)]),
  );
}

export function comparisonReport(implementation, artifacts) {
  return artifacts.map(({ name, version, document, inventory, manifest }) => ({
    package: name,
    version,
    canonicalSha256:
      manifest.artifacts[
        `${name.split('/')[1].replace('-contracts', '')}-canonical.json`
      ],
    profile: manifest.profile.id,
    supportedCapabilities: [],
    hostConformanceBlockers: manifest.hostConformanceBlockers,
    operations: inventory.operations.map(
      ({ method, path, definition, security }) => {
        const current = implementation.paths?.[path]?.[method.toLowerCase()];
        const differences = [];
        if (!current) differences.push('route');
        else {
          for (const key of [
            'requestBody',
            'parameters',
            'responses',
            'security',
          ]) {
            if (
              json(
                expand(
                  current[key] ?? (key === 'parameters' ? [] : {}),
                  implementation,
                ),
              ) !==
              json(
                expand(
                  definition[key] ?? (key === 'parameters' ? [] : {}),
                  document,
                ),
              )
            )
              differences.push(key);
          }
        }
        return {
          method,
          path,
          operationId: definition.operationId,
          security,
          inCanonicalPaths: Boolean(
            document.paths[path]?.[method.toLowerCase()],
          ),
          structuralDifferences: differences,
        };
      },
    ),
  }));
}
