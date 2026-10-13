/** #487: read-only, revision-pinned legacy evidence; never a canonical schema source. */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { mkdirSync, writeFileSync } from 'node:fs';
import ts from 'typescript';

const revision = 'ecda1b6e0d9bc39c66373452a92dce91e06abee0';
const repository =
  'https://github.com/anarchitects/anarchitecture-bricks-3tier';
const git = (...args) =>
  execFileSync('git', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
const sha256 = (value) => createHash('sha256').update(value).digest('hex');
const read = (path) => git('show', `${revision}:${path}`);
const files = git('ls-tree', '-r', '--name-only', revision).trim().split('\n');
const domainPath =
  /^libs\/(auth|forms|identity|newsletter)\/(ts|nest|angular|declarations)\//;
const sourceFiles = files
  .filter(
    (path) =>
      (domainPath.test(path) && /\.(ts|mts|cts|mjs|json|snap)$/.test(path)) ||
      /^(tools\/api-specs\/|docs\/openapi\/)/.test(path) ||
      /^tools\/testing\//.test(path) ||
      (/^examples\/(auth-angular|forms-angular|newsletter-)/.test(path) &&
        /\.(ts|mts|cts|mjs|json)$/.test(path)) ||
      /^libs\/ts\/frontend\/data-access\//.test(path) ||
      ['package.json', 'yarn.lock', 'tsconfig.base.json'].includes(path),
  )
  .sort();
const sources = new Map(sourceFiles.map((path) => [path, read(path)]));
const syntax = (path, source) =>
  ts.createSourceFile(path, source, ts.ScriptTarget.Latest, true);
const decorators = (node) =>
  ts.canHaveDecorators(node) ? (ts.getDecorators(node) ?? []) : [];
const decoratorCall = (decorator) =>
  ts.isCallExpression(decorator.expression) ? decorator.expression : null;
const literal = (node) =>
  node && ts.isStringLiteralLike(node) ? node.text : null;
const walk = (node, visit) => {
  visit(node);
  ts.forEachChild(node, (child) => walk(child, visit));
};
const routes = [];
const dtoFiles = [];
const angularConsumers = [];
const testFiles = [];
const packageManifests = [];

for (const [path, source] of sources) {
  if (domainPath.test(path) && path.endsWith('/package.json')) {
    const pkg = JSON.parse(source);
    packageManifests.push({
      path,
      name: pkg.name,
      version: pkg.version,
      exports: pkg.exports ?? null,
      dependencies: pkg.dependencies ?? {},
      peerDependencies: pkg.peerDependencies ?? {},
    });
  }
  if (!/\.(ts|mts|cts|mjs)$/.test(path)) continue;
  const ast = syntax(path, source);
  const imports = ast.statements.filter(ts.isImportDeclaration).map((node) => ({
    from: literal(node.moduleSpecifier),
    bindings: node.importClause?.getText(ast) ?? '',
    line: ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1,
  }));
  if (
    /\/ts\/src\//.test(path) &&
    domainPath.test(path) &&
    !/\.(spec|test)\./.test(path)
  ) {
    const exports = [];
    for (const node of ast.statements) {
      if (ts.isExportDeclaration(node)) exports.push(node.getText(ast));
      else if (
        node.modifiers?.some(
          (modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword,
        )
      ) {
        if (ts.isVariableStatement(node))
          exports.push(
            ...node.declarationList.declarations.map((declaration) =>
              declaration.name.getText(ast),
            ),
          );
        else if (node.name) exports.push(node.name.getText(ast));
      }
    }
    dtoFiles.push({
      path,
      category: path.split('/src/')[1].split('/')[0],
      exports,
      typeboxImports: imports.filter((item) =>
        item.from?.startsWith('@sinclair/typebox'),
      ),
    });
  }
  const angular =
    /\/angular\//.test(path) ||
    /angular-example/.test(path) ||
    path.startsWith('libs/ts/frontend/data-access/');
  if (angular) {
    const contractImports = imports.filter((item) =>
      /@anarchitects\/(auth|forms|identity|newsletter)-ts|frontend\/data-access|generated|openapi/.test(
        item.from ?? '',
      ),
    );
    const httpCalls = [];
    walk(ast, (node) => {
      if (
        ts.isCallExpression(node) &&
        ts.isPropertyAccessExpression(node.expression) &&
        /^(get|post|patch|put|delete|request)$/.test(
          node.expression.name.text,
        ) &&
        /http|client/i.test(node.expression.expression.getText(ast))
      ) {
        httpCalls.push({
          line: ast.getLineAndCharacterOfPosition(node.getStart(ast)).line + 1,
          call: node.expression.getText(ast),
          url: node.arguments[0]?.getText(ast) ?? '',
          types: node.typeArguments?.map((type) => type.getText(ast)) ?? [],
        });
      }
    });
    if (contractImports.length || httpCalls.length)
      angularConsumers.push({
        path,
        test: /\.(spec|test)\./.test(path),
        contractImports,
        httpCalls,
      });
  }
  if (/\.(spec|test)\.|\/tests\/|\/consumer\.[cm]ts$/.test(path)) {
    const titles = [];
    walk(ast, (node) => {
      if (
        ts.isCallExpression(node) &&
        /^(it|test|describe)(\.|\(|$)/.test(node.expression.getText(ast))
      ) {
        const title = literal(node.arguments[0]);
        if (title !== null) titles.push(title);
      }
    });
    testFiles.push({ path, titles });
  }
  if (!domainPath.test(path) || !path.endsWith('.controller.ts')) continue;
  walk(ast, (node) => {
    if (!ts.isClassDeclaration(node)) return;
    const controller = decorators(node)
      .map(decoratorCall)
      .find((call) => call?.expression.getText(ast) === 'Controller');
    if (!controller) return;
    const prefix = controller.arguments.length
      ? literal(controller.arguments[0])
      : '';
    for (const member of node.members) {
      if (!ts.isMethodDeclaration(member)) continue;
      const calls = decorators(member).map(decoratorCall).filter(Boolean);
      const verb = calls.find((call) =>
        /^(Get|Post|Patch|Put|Delete|Options|Head|All)$/.test(
          call.expression.getText(ast),
        ),
      );
      if (!verb) continue;
      const suffix = verb.arguments.length ? literal(verb.arguments[0]) : '';
      if (prefix === null || suffix === null)
        throw new Error(
          `Unresolved route: ${path}:${member.name.getText(ast)}`,
        );
      const routePath = `/${[prefix, suffix]
        .map((part) => part.replace(/^\/+|\/+$/g, ''))
        .filter(Boolean)
        .join('/')}`.replace(/:([A-Za-z0-9_]+)/g, '{$1}');
      const method = verb.expression.getText(ast).toUpperCase();
      const schema = calls.find(
        (call) => call.expression.getText(ast) === 'RouteSchema',
      );
      const code = calls.find(
        (call) => call.expression.getText(ast) === 'HttpCode',
      );
      routes.push({
        key: `${method} ${routePath}`,
        path: routePath,
        method,
        controller: node.name?.text,
        handler: member.name.getText(ast),
        file: path,
        line: ast.getLineAndCharacterOfPosition(member.getStart(ast)).line + 1,
        declaredSuccessStatus: code
          ? Number(code.arguments[0].getText(ast))
          : method === 'POST'
            ? 201
            : 200,
        schemaBinding: schema?.arguments[0]?.getText(ast) ?? null,
        publicDecorator: calls.some(
          (call) => call.expression.getText(ast) === 'Public',
        ),
        imports: imports.filter((item) =>
          item.from?.startsWith('@anarchitects/'),
        ),
      });
    }
  });
}
const openapiPath = 'docs/openapi/openapi.json';
const openapi = JSON.parse(sources.get(openapiPath));
const operations = Object.entries(openapi.paths)
  .flatMap(([path, methods]) =>
    Object.entries(methods)
      .filter(([method]) =>
        /^(get|post|put|patch|delete|options|head)$/.test(method),
      )
      .map(([method, operation]) => ({
        key: `${method.toUpperCase()} ${path}`,
        operationId: operation.operationId,
        tags: operation.tags,
        pointer: `/paths/${path.replaceAll('~', '~0').replaceAll('/', '~1')}/${method}`,
        sha256: sha256(JSON.stringify(operation)),
        parameters: operation.parameters ?? [],
        requestBody: operation.requestBody ?? null,
        responses: operation.responses,
        security: operation.security ?? openapi.security ?? null,
      })),
  )
  .sort((a, b) => a.key.localeCompare(b.key));
const metadataSource = sources.get('tools/api-specs/route-metadata.ts');
const operationIdMappings = [
  ...metadataSource.matchAll(
    /'((?:GET|POST|PATCH|PUT|DELETE) [^']+)':\s*'([^']+)'/g,
  ),
].map((match) => ({ key: match[1], operationId: match[2] }));
const routeKeys = new Set(routes.map((route) => route.key));
const specKeys = new Set(operations.map((operation) => operation.key));
if (routeKeys.size !== routes.length)
  throw new Error('Duplicate route keys need explicit audit handling.');
const inventory = {
  evidenceKind: 'legacy-implementation-baseline-not-canonical',
  revision,
  repository,
  scope:
    'Static default-path controllers, all domain TS source exports, Angular TS imports/HTTP calls, test references and source hashes. Dynamic mounting, auth profiles and runtime semantics require the accompanying audit.',
  sourceFiles: [...sources].map(([path, source]) => ({
    path,
    sha256: sha256(source),
    url: `${repository}/blob/${revision}/${path}`,
  })),
  openapi: {
    path: openapiPath,
    version: openapi.openapi,
    infoVersion: openapi.info.version,
    sha256: sha256(sources.get(openapiPath)),
    securitySchemes: openapi.components?.securitySchemes ?? null,
    operations,
  },
  routes: routes.sort((a, b) => a.key.localeCompare(b.key)),
  operationIdMappings,
  discrepancies: {
    controllerRoutesMissingFromOpenapi: routes
      .filter((route) => !specKeys.has(route.key))
      .map((route) => route.key),
    openapiWithoutController: operations
      .filter((operation) => !routeKeys.has(operation.key))
      .map((operation) => operation.key),
    staleOperationIdMappings: operationIdMappings.filter(
      (entry) => !routeKeys.has(entry.key),
    ),
  },
  dtoFiles,
  angularConsumers,
  testFiles,
  packageManifests,
};
mkdirSync('dist/api-audit', { recursive: true });
writeFileSync(
  'dist/api-audit/legacy-inventory.json',
  `${JSON.stringify(inventory, null, 2)}\n`,
);
console.log(
  JSON.stringify(
    {
      revision,
      files: sourceFiles.length,
      routes: routes.length,
      operations: operations.length,
      tsFiles: dtoFiles.length,
      angularConsumers: angularConsumers.length,
      discrepancies: inventory.discrepancies,
    },
    null,
    2,
  ),
);
