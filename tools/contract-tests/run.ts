import { readFileSync } from 'fs';
import { join } from 'path';
import { parse } from 'yaml';

type SpecDocument = Record<string, unknown>;

type OperationRef = {
  path: string;
  method: string;
  operationId: string | undefined;
  responses: Record<string, unknown> | undefined;
};

type TestResult = {
  name: string;
  passed: boolean;
  details?: string;
};

const SPEC_PATH = join(process.cwd(), 'contracts/openapi.yaml');

function loadSpec(): SpecDocument {
  const raw = readFileSync(SPEC_PATH, 'utf8');
  return parse(raw) as SpecDocument;
}

function assertContact(spec: SpecDocument): TestResult {
  const info = spec?.info as Record<string, unknown> | undefined;
  const contact = info?.contact as Record<string, unknown> | undefined;

  if (!info) {
    return {
      name: 'info block present',
      passed: false,
      details: 'Missing root info object.',
    };
  }

  if (!contact) {
    return {
      name: 'contact present',
      passed: false,
      details: 'info.contact is required.',
    };
  }

  const name = contact.name;
  const email = contact.email;

  if (typeof name !== 'string' || name.trim().length === 0) {
    return {
      name: 'contact name populated',
      passed: false,
      details: 'info.contact.name must be a non-empty string.',
    };
  }

  if (typeof email !== 'string' || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return {
      name: 'contact email valid',
      passed: false,
      details: 'info.contact.email must be a valid email address.',
    };
  }

  return { name: 'info contact block', passed: true };
}

function collectOperations(spec: SpecDocument): OperationRef[] {
  const paths = (spec.paths ?? {}) as Record<string, unknown>;
  const httpMethods = new Set([
    'get',
    'put',
    'post',
    'delete',
    'options',
    'head',
    'patch',
    'trace',
  ]);

  const operations: OperationRef[] = [];

  for (const [pathKey, value] of Object.entries(paths)) {
    if (!value || typeof value !== 'object') continue;
    const pathItem = value as Record<string, unknown>;

    for (const [method, operation] of Object.entries(pathItem)) {
      if (!httpMethods.has(method)) continue;
      operations.push({
        path: pathKey,
        method,
        operationId: (operation as Record<string, unknown>).operationId as string | undefined,
        responses: (operation as Record<string, unknown>).responses as Record<string, unknown> | undefined,
      });
    }
  }

  return operations;
}

function requireOperationIds(operations: OperationRef[]): TestResult {
  const missing = operations.filter((op) => !op.operationId);

  if (missing.length > 0) {
    return {
      name: 'operationId present',
      passed: false,
      details: missing
        .map((op) => `${op.method.toUpperCase()} ${op.path}`)
        .join(', '),
    };
  }

  const seen = new Map<string, OperationRef>();
  const duplicates: string[] = [];

  for (const operation of operations) {
    if (!operation.operationId) continue;
    const previous = seen.get(operation.operationId);
    if (previous) {
      duplicates.push(
        `${operation.operationId} used for ${previous.method.toUpperCase()} ${previous.path} and ${operation.method.toUpperCase()} ${operation.path}`
      );
    } else {
      seen.set(operation.operationId, operation);
    }
  }

  if (duplicates.length > 0) {
    return {
      name: 'operationId uniqueness',
      passed: false,
      details: duplicates.join('; '),
    };
  }

  return { name: 'operationId checks', passed: true };
}

function ensureSuccessResponse(operations: OperationRef[]): TestResult {
  const failing: string[] = [];

  for (const operation of operations) {
    const responses = operation.responses ?? {};
    const codes = Object.keys(responses);
    const hasSuccess = codes.some((code) => {
      if (!code) return false;
      if (code.toLowerCase() === 'default') return false;
      if (code.endsWith('XX')) {
        const prefix = code[0];
        return prefix === '2' || prefix === '3';
      }
      const numeric = Number(code);
      if (Number.isNaN(numeric)) return false;
      return numeric >= 200 && numeric < 400;
    });

    if (!hasSuccess) {
      failing.push(`${operation.method.toUpperCase()} ${operation.path}`);
    }
  }

  if (failing.length > 0) {
    return {
      name: 'success responses present',
      passed: false,
      details: failing.join(', '),
    };
  }

  return { name: 'success responses present', passed: true };
}

function collectRefs(node: unknown, refs: Set<string>) {
  if (Array.isArray(node)) {
    for (const item of node) {
      collectRefs(item, refs);
    }
    return;
  }

  if (!node || typeof node !== 'object') {
    return;
  }

  for (const [key, value] of Object.entries(node)) {
    if (key === '$ref' && typeof value === 'string') {
      refs.add(value);
    }
    collectRefs(value, refs);
  }
}

function decodeJsonPointerSegment(segment: string): string {
  return segment.replace(/~1/g, '/').replace(/~0/g, '~');
}

function resolveRef(spec: SpecDocument, ref: string): boolean {
  if (!ref.startsWith('#/')) {
    // External refs are out-of-scope for this test suite.
    return true;
  }

  const segments = ref
    .slice(2)
    .split('/')
    .map(decodeJsonPointerSegment);

  let current: unknown = spec;

  for (const segment of segments) {
    if (!current || typeof current !== 'object' || !(segment in current)) {
      return false;
    }
    current = (current as Record<string, unknown>)[segment];
  }

  return current !== undefined;
}

function verifyRefs(spec: SpecDocument): TestResult {
  const refs = new Set<string>();
  collectRefs(spec, refs);

  const unresolved = Array.from(refs).filter((ref) => !resolveRef(spec, ref));

  if (unresolved.length > 0) {
    return {
      name: '$ref resolution',
      passed: false,
      details: unresolved.join(', '),
    };
  }

  return { name: '$ref resolution', passed: true };
}

function run() {
  const spec = loadSpec();
  const operations = collectOperations(spec);

  const checks: TestResult[] = [
    assertContact(spec),
    requireOperationIds(operations),
    ensureSuccessResponse(operations),
    verifyRefs(spec),
  ];

  const failures = checks.filter((check) => !check.passed);

  for (const check of checks) {
    const status = check.passed ? 'PASS' : 'FAIL';
    const message = check.details ? ` - ${check.details}` : '';
    console.log(`${status} ${check.name}${message}`);
  }

  if (failures.length > 0) {
    console.error(`\nContract verification failed (${failures.length} error${failures.length === 1 ? '' : 's'}).`);
    process.exitCode = 1;
    return;
  }

  console.log('\nAll contract verification checks passed.');
}

run();
