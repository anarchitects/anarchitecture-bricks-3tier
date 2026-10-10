import assert from 'node:assert/strict';

export const nestPackages = [
  {
    name: 'auth-nest',
    root: 'libs/auth/nest',
    expectedPeers: {
      '@nestjs/common': '^11.1.6 || ^12.1.2',
      '@nestjs/config': '^4.0.2 || ^12.0.1',
      '@nestjs/core': '^11.1.6 || ^12.1.2',
      '@nestjs/jwt': '^11.0.1 || ^12.0.2',
      '@nestjs/platform-fastify': '^11.1.6 || ^12.1.2',
      '@nestjs/typeorm': '^11.0.1 || ^12.0.2',
      typeorm: '^1.1.0',
    },
    expectedDependencies: {
      '@anarchitects/better-auth-typeorm-adapter': '0.2.0',
      '@better-auth/core': '1.7.2',
      '@better-auth/passkey': '1.7.2',
      '@better-auth/utils': '0.4.2',
      '@better-fetch/fetch': '1.3.1',
      'better-auth': '1.7.2',
      'better-call': '1.4.0',
      jose: '^6.2.3',
      kysely: '^0.29.0',
      nanostores: '^1.3.0',
    },
    requiredFiles: [
      'src/infrastructure-persistence/migrations/1788275931000-add-better-auth-account-issuer.js',
      'src/infrastructure-persistence/migrations/1788275931000-add-better-auth-account-issuer.d.ts',
    ],
  },
  {
    name: 'forms-nest',
    root: 'libs/forms/nest',
    expectedPeers: {
      '@nestjs/common': '^11.1.6 || ^12.1.2',
      '@nestjs/config': '^4.0.2 || ^12.0.1',
      '@nestjs/platform-fastify': '^11.1.6 || ^12.1.2',
      '@nestjs/typeorm': '^11.0.1 || ^12.0.2',
      typeorm: '^1.1.0',
    },
    requiredFiles: [],
  },
  {
    name: 'identity-nest',
    root: 'libs/identity/nest',
    expectedPeers: {
      '@nestjs/common': '^11.1.6 || ^12.1.2',
      '@nestjs/config': '^4.0.2 || ^12.0.1',
      '@nestjs/platform-fastify': '^11.1.6 || ^12.1.2',
      '@nestjs/typeorm': '^11.0.1 || ^12.0.2',
      typeorm: '^1.1.0',
    },
    requiredFiles: [],
  },
  {
    name: 'auth-declarations',
    root: 'libs/auth/declarations',
    expectedPeers: { '@nestjs/common': '^11.1.6 || ^12.1.2' },
    requiredFiles: [],
  },
  {
    name: 'common-nest-mailer',
    root: 'libs/common/nest/mailer',
    expectedPeers: {
      '@nestjs/common': '^11.1.6 || ^12.1.2',
      '@nestjs/config': '^4.0.2 || ^12.0.1',
      '@nestjs-modules/mailer': '^3.0.2',
      nodemailer: '^8.0.5',
    },
    requiredFiles: [],
  },
  {
    name: 'newsletter-nest',
    root: 'libs/newsletter/nest',
    expectedPeers: {
      '@nestjs/common': '^11.1.6 || ^12.1.2',
      '@nestjs/core': '^11.1.6 || ^12.1.2',
      '@nestjs/config': '^4.0.2 || ^12.0.1',
      '@nestjs/platform-fastify': '^11.1.6 || ^12.1.2',
      fastify: '^5.4.0',
      typeorm: '^1.1.0',
      '@anarchitects/common-nest-mailer': '^0.5.0',
    },
    requiredFiles: [],
  },
];

const nodeRange = '^20.19.0 || ^22.13.0 || >=24.11.0';
const layers = {
  'auth-nest': [
    'application',
    'infrastructure-mailer',
    'infrastructure-persistence',
    'presentation',
    'config',
  ],
  'forms-nest': [
    'application',
    'config',
    'infrastructure-mailer',
    'infrastructure-persistence',
    'presentation',
  ],
  'identity-nest': [
    'application',
    'config',
    'infrastructure',
    'infrastructure-persistence',
    'presentation',
  ],
  'newsletter-nest': [
    'application',
    'config',
    'infrastructure-mailerlite',
    'infrastructure-persistence',
    'presentation',
    'infrastructure-native',
  ],
};

export function validateNestPackageContract(
  project,
  source,
  built,
  packed,
  files,
) {
  const label = project.name;
  assert.equal(source.name, `@anarchitects/${label}`, `${label}: package name`);
  assert.deepEqual(
    source.peerDependencies,
    project.expectedPeers,
    `${label}: supported peers`,
  );
  assert.deepEqual(
    source.engines,
    layers[label] ? { node: nodeRange } : undefined,
    `${label}: engines`,
  );
  assert.deepEqual(
    source.peerDependenciesMeta,
    label === 'newsletter-nest'
      ? {
          typeorm: { optional: true },
          '@anarchitects/common-nest-mailer': { optional: true },
        }
      : undefined,
    `${label}: optional peers`,
  );
  for (const [name, range] of Object.entries(
    project.expectedDependencies ?? {},
  ))
    assert.equal(
      source.dependencies?.[name],
      range,
      `${label}: dependency ${name}`,
    );
  // Nx adds exports for the CommonJS layer entry points. Everything declared
  // in source (including engines, optional peers and typesVersions) must survive.
  for (const [field, value] of Object.entries(source))
    assert.deepEqual(built[field], value, `${label}: source/build ${field}`);
  assert.deepEqual(packed, built, `${label}: build/packed manifest`);
  for (const field of [
    'dependencies',
    'peerDependencies',
    'optionalDependencies',
  ])
    for (const name of Object.keys(packed[field] ?? {}))
      assert.doesNotMatch(
        name,
        /^(?:nx$|@nx\/|@nestjs\/(?:cli|schematics)$|@anarchitects\/nest$)/,
        `${label}: runtime tooling dependency`,
      );

  if (layers[label]) {
    const expected = {
      './package.json': './package.json',
      '.': { types: source.types, default: source.main },
    };
    for (const layer of layers[label]) {
      expected[`./${layer}`] = `./src/${layer}/index.js`;
      expected[`./${layer}/index`] = `./src/${layer}/index.js`;
      assert.deepEqual(
        source.typesVersions?.['*']?.[layer],
        [`src/${layer}/index.d.ts`],
        `${label}: ${layer} declaration mapping`,
      );
    }
    assert.deepEqual(packed.exports, expected, `${label}: generated exports`);
    assert.deepEqual(
      built,
      { ...source, exports: expected },
      `${label}: unexpected build metadata`,
    );
  } else {
    assert.deepEqual(packed.exports, source.exports, `${label}: exports`);
    assert.deepEqual(built, source, `${label}: unexpected build metadata`);
  }
  const packedFiles = new Set(files);
  const checkTarget = (target) => {
    if (typeof target === 'string') {
      assert.ok(
        target.startsWith('./') && !target.includes('..', 2),
        `${label}: invalid export ${target}`,
      );
      assert.ok(
        packedFiles.has(target.slice(2)),
        `${label}: missing packed export ${target}`,
      );
    } else if (target && typeof target === 'object') {
      Object.values(target).forEach(checkTarget);
    }
  };
  checkTarget(packed.exports);
  for (const field of ['main', 'module', 'types'])
    if (packed[field]) checkTarget(packed[field]);
  for (const mappings of Object.values(packed.typesVersions ?? {}))
    for (const targets of Object.values(mappings))
      for (const target of targets) checkTarget(`./${target}`);
  for (const file of project.requiredFiles)
    assert.ok(packedFiles.has(file), `${label}: missing packed file ${file}`);
}
