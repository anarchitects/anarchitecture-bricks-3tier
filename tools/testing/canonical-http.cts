import assert from 'node:assert/strict';
import { request as httpRequest } from 'node:http';
import { createRequire } from 'node:module';
import type { Server } from 'node:http';

// Resolve Contracts through the installed brick that owns the dependency. The
// fixture runs outside the workspace, with no source aliases or workspace loader.
type Schema = { parse(value: unknown): unknown };
type Operation = {
  method: string;
  path: string;
  operationId: string;
  responses: Record<
    string,
    {
      body: { kind: string; content?: Record<string, Schema> };
      headers: {
        name: string;
        schema: Schema;
        cardinality: 'single' | 'repeated';
      }[];
    }
  >;
};
const operationCache = new Map<
  string,
  {
    operations: Operation[];
    version: string;
    canonicalSha256: string;
  }
>();
function contracts(domain: string) {
  let entry = operationCache.get(domain);
  if (!entry) {
    const fromBrick = createRequire(
      require.resolve(`@anarchitects/${domain}-ts`),
    );
    const canonical = fromBrick(`@anarchitects/${domain}-contracts`);
    const manifest = fromBrick(
      `@anarchitects/${domain}-contracts/manifest.json`,
    );
    entry = {
      version: manifest.packages[`@anarchitects/${domain}-contracts`],
      canonicalSha256: manifest.artifacts[`${domain}-canonical.json`],
      operations: [...canonical[`${domain}Operations`]].sort(
        (a, b) =>
          (a.path.match(/\{/g)?.length ?? 0) -
          (b.path.match(/\{/g)?.length ?? 0),
      ),
    };
    operationCache.set(domain, entry);
  }
  return entry;
}

const observed = new Map<string, Set<number>>();
export function assertCanonicalCoverage(domains: string[]) {
  for (const domain of domains) {
    const operations = contracts(domain).operations;
    for (const operation of operations) {
      assert.ok(
        [...(observed.get(operation.operationId) ?? [])].some(
          (status) => status >= 200 && status < 300,
        ),
        `Missing successful TCP response evidence: ${operation.operationId}`,
      );
    }
    assert.ok(
      operations.some((operation) =>
        [...(observed.get(operation.operationId) ?? [])].some(
          (status) => status >= 400,
        ),
      ),
      `Missing negative TCP response evidence: ${domain}`,
    );
    console.log(
      JSON.stringify({
        check: 'canonical-http-coverage',
        domain,
        version: contracts(domain).version,
        canonicalSha256: contracts(domain).canonicalSha256,
        operations: operations.map(({ operationId }) => ({
          operationId,
          statuses: [...(observed.get(operationId) ?? [])].sort(),
        })),
      }),
    );
  }
}

export async function canonicalRequest(
  app: {
    getHttpServer(): Server;
    listen(port: number, host: string): Promise<unknown>;
  },
  options: {
    method: string;
    url: string;
    payload?: unknown;
    headers?: Record<string, string>;
    expectAbsent?: boolean;
    canonicalPath?: string;
    evidence?: 'adapter-only';
  },
) {
  const server = app.getHttpServer();
  if (!server.listening) await app.listen(0, '127.0.0.1');
  const address = server.address();
  assert.ok(address && typeof address !== 'string');
  const body =
    options.payload === undefined
      ? undefined
      : typeof options.payload === 'string'
        ? options.payload
        : JSON.stringify(options.payload);
  // node:http deliberately avoids the provider-fetch double used by Newsletter.
  const response = await new Promise<{
    statusCode: number;
    headers: import('node:http').IncomingHttpHeaders;
    body: string;
    // eslint-disable-next-line @typescript-eslint/no-explicit-any -- Match Fastify inject's generic JSON convenience API; canonical parsing below validates the wire body.
    json(): any;
  }>((resolve, reject) => {
    const request = httpRequest(
      {
        hostname: '127.0.0.1',
        port: address.port,
        path: options.url,
        method: options.method,
        headers: {
          ...(body === undefined
            ? {}
            : {
                'content-type': 'application/json',
                'content-length': Buffer.byteLength(body),
              }),
          ...options.headers,
        },
        timeout: 10000,
      },
      (incoming) => {
        const chunks: Buffer[] = [];
        incoming.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
        incoming.on('error', reject);
        incoming.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8');
          assert.ok(incoming.statusCode);
          resolve({
            statusCode: incoming.statusCode,
            headers: incoming.headers,
            body: text,
            json: () => JSON.parse(text),
          });
        });
      },
    );
    request.on('error', reject);
    request.on('timeout', () =>
      request.destroy(new Error('Canonical HTTP request timed out')),
    );
    request.end(body);
  });
  if (options.expectAbsent) {
    assert.equal(
      response.statusCode,
      404,
      'A disabled capability or unsupported method must remain absent',
    );
    console.log(
      JSON.stringify({
        check: 'host-route-absence',
        method: options.method,
        path: options.url.split('?')[0],
        status: 404,
        transport: 'tcp',
      }),
    );
    return response;
  }
  const path = new URL(
    options.canonicalPath ?? options.url,
    'http://fixture.local',
  ).pathname.replace(/^\/api(?=\/)/, '');
  const domain = path.split('/')[1];
  if (!['auth', 'forms', 'identity', 'newsletter'].includes(domain))
    return response;
  const canonical = contracts(domain);
  const operation = canonical.operations.find(
    (candidate) =>
      candidate.method === options.method &&
      new RegExp(`^${candidate.path.replace(/\{[^}]+\}/g, '[^/]+')}$`).test(
        path,
      ),
  );
  assert.ok(operation, `No canonical operation for ${options.method} ${path}`);
  const expected = operation.responses[String(response.statusCode)];
  assert.ok(
    expected,
    `${operation.operationId}: undocumented status ${response.statusCode}`,
  );
  const schema = expected.body.content?.['application/json'];
  if (expected.body.kind === 'json') {
    assert.ok(schema);
    schema.parse(response.json());
  }
  for (const header of expected.headers) {
    const value = response.headers[header.name.toLowerCase()];
    if (value !== undefined) {
      if (header.cardinality === 'repeated') {
        for (const item of Array.isArray(value) ? value : [value])
          header.schema.parse(item);
      } else header.schema.parse(value);
    }
  }
  const statuses = observed.get(operation.operationId) ?? new Set<number>();
  statuses.add(response.statusCode);
  observed.set(operation.operationId, statuses);
  console.log(
    JSON.stringify({
      check: 'canonical-http-response',
      operationId: operation.operationId,
      status: response.statusCode,
      profile: 'published-operation',
      transport: 'tcp',
      evidence: options.evidence ?? 'application-host',
    }),
  );
  return response;
}
