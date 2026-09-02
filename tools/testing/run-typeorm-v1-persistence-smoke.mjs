import assert from 'node:assert/strict';
import path from 'node:path';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';
import { Client } from 'pg';
import { GenericContainer, Wait } from 'testcontainers';
import { DataSource } from 'typeorm';
import {
  createIdentityAuthUserForeignKey,
  IDENTITY_AUTH_USER_FOREIGN_KEY,
  IntegrationAuthUserSchema,
  IntegrationUserProfileSchema,
} from './typeorm-integration-schemas.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const workspaceRoot = path.resolve(__dirname, '..', '..');
const require = createRequire(import.meta.url);

const databases = {
  upgrade: 'anarchitecture_upgrade',
  clean: 'anarchitecture_clean',
  invalid: 'anarchitecture_invalid',
};
const authUserId = '01900000-0000-7000-8000-000000000001';
const githubUserId = '01900000-0000-7000-8000-000000000002';

async function main() {
  const artifacts = loadBuiltArtifacts();
  let container;

  try {
    container = await new GenericContainer('postgres:16-alpine')
      .withEnvironment({
        POSTGRES_DB: 'postgres',
        POSTGRES_USER: 'postgres',
        POSTGRES_PASSWORD: 'postgres',
      })
      .withExposedPorts(5432)
      .withWaitStrategy(Wait.forListeningPorts())
      .start();

    const connection = {
      host: container.getHost(),
      port: container.getMappedPort(5432),
      username: 'postgres',
      password: 'postgres',
    };
    await waitForPostgres(connection);
    await createDatabases(connection, Object.values(databases));

    await validatePopulatedUpgrade(connection, artifacts);
    await validateCleanMigrationChain(connection, artifacts);
    await validateInvalidIssuerFailsSafely(connection, artifacts);
  } finally {
    if (container) {
      await container.stop();
    }
  }

  console.log('TypeORM 1.1 persistence compatibility smoke passed.');
}

async function validatePopulatedUpgrade(connection, artifacts) {
  const baselineMigrations = getBaselineMigrations(artifacts);
  const allMigrations = [
    ...baselineMigrations,
    artifacts.accountIssuerMigration,
  ];
  const baseline = await createMigrationDataSource(
    connection,
    databases.upgrade,
    baselineMigrations,
  );

  await baseline.runMigrations({ transaction: 'all' });
  await seedLegacyAuthRows(baseline);
  await baseline.destroy();

  const integrationDataSource = new DataSource({
    ...postgresOptions(connection, databases.upgrade),
    entities: [IntegrationAuthUserSchema, IntegrationUserProfileSchema],
    synchronize: false,
  });
  await integrationDataSource.initialize();
  const integrationRunner = integrationDataSource.createQueryRunner();
  await integrationRunner.createForeignKey(
    'identity.user_profiles',
    createIdentityAuthUserForeignKey(),
  );
  await integrationRunner.release();
  await integrationDataSource.destroy();

  const upgrade = await createMigrationDataSource(
    connection,
    databases.upgrade,
    allMigrations,
  );
  await upgrade.runMigrations({ transaction: 'all' });
  await assertIssuerMigration(upgrade);
  await assertCrossDomainForeignKey(upgrade);

  await upgrade.undoLastMigration({ transaction: 'all' });
  const rolledBackColumns = await upgrade.query(
    `SELECT column_name FROM information_schema.columns
      WHERE table_schema = 'auth'
        AND table_name = 'accounts'
        AND column_name = 'issuer'`,
  );
  assert.equal(rolledBackColumns.length, 0, 'issuer rollback must drop column');
  await assertCrossDomainForeignKey(upgrade);

  await upgrade.runMigrations({ transaction: 'all' });
  await assertIssuerMigration(upgrade);
  await assertCrossDomainForeignKey(upgrade);
  await upgrade.destroy();

  const runtime = new DataSource({
    ...postgresOptions(connection, databases.upgrade),
    entities: [
      artifacts.formConfigEntity,
      artifacts.submissionEntity,
      artifacts.userProfileEntity,
    ],
    synchronize: false,
  });
  await runtime.initialize();
  await validateFormsPersistence(runtime, artifacts);
  await validateIdentityPersistence(runtime, artifacts);
  await runtime.destroy();
}

async function validateCleanMigrationChain(connection, artifacts) {
  const clean = await createMigrationDataSource(connection, databases.clean, [
    ...getBaselineMigrations(artifacts),
    artifacts.accountIssuerMigration,
  ]);
  const migrations = await clean.runMigrations({ transaction: 'all' });
  assert.equal(
    migrations.length,
    6,
    'clean database must apply six migrations',
  );

  const queryRunner = clean.createQueryRunner();
  try {
    for (const tableName of [
      'auth.users',
      'auth.accounts',
      'auth.passkeys',
      'forms.form_configs',
      'forms.form_submissions',
      'identity.user_profiles',
    ]) {
      assert.equal(
        await queryRunner.hasTable(tableName),
        true,
        `clean migration chain must create ${tableName}`,
      );
    }
  } finally {
    await queryRunner.release();
  }

  const issuerColumn = await clean.query(
    `SELECT is_nullable FROM information_schema.columns
      WHERE table_schema = 'auth'
        AND table_name = 'accounts'
        AND column_name = 'issuer'`,
  );
  assert.deepEqual(issuerColumn, [{ is_nullable: 'NO' }]);
  await clean.destroy();
}

async function validateInvalidIssuerFailsSafely(connection, artifacts) {
  const baselineMigrations = getBaselineMigrations(artifacts);
  const invalid = await createMigrationDataSource(
    connection,
    databases.invalid,
    baselineMigrations,
  );
  await invalid.runMigrations({ transaction: 'all' });
  await seedLegacyAuthRows(invalid, { includeGithub: false });
  await invalid.query(
    `ALTER TABLE "auth"."accounts" ADD COLUMN "issuer" varchar(255)`,
  );
  await invalid.query(
    `UPDATE "auth"."accounts" SET "issuer" = 'https://unexpected.example'`,
  );
  await invalid.destroy();

  const upgrade = await createMigrationDataSource(
    connection,
    databases.invalid,
    [...baselineMigrations, artifacts.accountIssuerMigration],
  );
  await assert.rejects(
    upgrade.runMigrations({ transaction: 'all' }),
    /non-provider-id issuer/,
  );
  const legacyConstraint = await upgrade.query(
    `SELECT constraint_name FROM information_schema.table_constraints
      WHERE table_schema = 'auth'
        AND table_name = 'accounts'
        AND constraint_name = 'UQ_auth_accounts_provider_account'`,
  );
  assert.equal(legacyConstraint.length, 1);
  const appliedUpgrade = await upgrade.query(
    `SELECT COUNT(*)::int AS count FROM migrations
      WHERE name = 'AddBetterAuthAccountIssuer1788275931000'`,
  );
  assert.equal(appliedUpgrade[0]?.count, 0);
  await upgrade.destroy();
}

async function seedLegacyAuthRows(dataSource, options = {}) {
  const includeGithub = options.includeGithub ?? true;
  await dataSource.query(
    `INSERT INTO "auth"."users"
      ("id", "email", "name", "emailVerified", "createdAt", "updatedAt")
     VALUES
      ($1, 'credential@example.test', 'Credential User', true, NOW(), NOW()),
      ($2, 'github@example.test', 'GitHub User', true, NOW(), NOW())`,
    [authUserId, githubUserId],
  );
  await dataSource.query(
    `INSERT INTO "auth"."accounts"
      ("id", "accountId", "providerId", "userId", "password", "createdAt", "updatedAt")
     VALUES
      ('credential-account', $1::varchar, 'credential', $2::uuid, 'hashed-password', NOW(), NOW())`,
    [authUserId, authUserId],
  );

  if (includeGithub) {
    await dataSource.query(
      `INSERT INTO "auth"."accounts"
        ("id", "accountId", "providerId", "userId", "createdAt", "updatedAt")
       VALUES
        ('github-account', 'github-subject', 'team/github', $1, NOW(), NOW())`,
      [githubUserId],
    );
  }
}

async function assertIssuerMigration(dataSource) {
  const rows = await dataSource.query(
    `SELECT "providerId", "issuer" FROM "auth"."accounts"
      ORDER BY "providerId"`,
  );
  assert.deepEqual(rows, [
    { providerId: 'credential', issuer: 'local:credential' },
    { providerId: 'team/github', issuer: 'local:oauth:team%2Fgithub' },
  ]);

  const constraints = await dataSource.query(
    `SELECT constraint_name FROM information_schema.table_constraints
      WHERE table_schema = 'auth'
        AND table_name = 'accounts'
        AND constraint_type = 'UNIQUE'
      ORDER BY constraint_name`,
  );
  assert.deepEqual(
    constraints.map((row) => row.constraint_name),
    ['UQ_auth_accounts_issuer_account'],
  );
}

async function assertCrossDomainForeignKey(dataSource) {
  const rows = await dataSource.query(
    `SELECT constraint_name FROM information_schema.table_constraints
      WHERE table_schema = 'identity'
        AND table_name = 'user_profiles'
        AND constraint_type = 'FOREIGN KEY'
        AND constraint_name = $1`,
    [IDENTITY_AUTH_USER_FOREIGN_KEY],
  );
  assert.equal(rows.length, 1, 'cross-domain integration FK must survive');
}

async function validateFormsPersistence(dataSource, artifacts) {
  const formConfigs = new artifacts.formConfigsRepository(
    dataSource.getRepository(artifacts.formConfigEntity),
  );
  await dataSource.getRepository(artifacts.formConfigEntity).save({
    id: 'contact',
    version: 1,
    fields: [],
    validationRules: [],
    security: null,
    delivery: null,
  });
  const config = await formConfigs.getFormConfig('contact', 1);
  assert.equal(config.id, 'contact');

  const submissions = new artifacts.submissionsRepository(
    dataSource.getRepository(artifacts.submissionEntity),
  );
  const created = await submissions.createSubmission({
    formId: 'contact',
    formVersion: 1,
    payload: { email: 'integration@example.test' },
  });
  assert.equal(
    (await submissions.getSubmission({ id: created.id })).id,
    created.id,
  );
}

async function validateIdentityPersistence(dataSource, artifacts) {
  const profiles = new artifacts.userProfilesRepository(
    dataSource.getRepository(artifacts.userProfileEntity),
  );
  const created = await profiles.save({
    id: '01900000-0000-7000-8000-000000000010',
    authUserId,
    displayName: 'Integration Profile',
  });
  assert.equal((await profiles.findByAuthUserId(authUserId))?.id, created.id);
  const updated = await profiles.update({
    id: created.id,
    displayName: 'Updated Integration Profile',
  });
  assert.equal(updated.displayName, 'Updated Integration Profile');

  await assert.rejects(
    profiles.save({
      id: '01900000-0000-7000-8000-000000000011',
      authUserId,
    }),
    /duplicate key value/,
  );
  await assert.rejects(
    profiles.save({
      id: '01900000-0000-7000-8000-000000000012',
      authUserId: '01900000-0000-7000-8000-000000000099',
    }),
    /foreign key constraint/,
  );
}

function getBaselineMigrations(artifacts) {
  return [
    artifacts.authSchemaMigration,
    artifacts.formsSchemaMigration,
    artifacts.formsValidationMigration,
    artifacts.identitySchemaMigration,
    artifacts.passkeysMigration,
  ];
}

async function createMigrationDataSource(connection, database, migrations) {
  const dataSource = new DataSource({
    ...postgresOptions(connection, database),
    migrations,
    migrationsTableName: 'migrations',
    migrationsTransactionMode: 'all',
    synchronize: false,
  });
  await dataSource.initialize();
  return dataSource;
}

function postgresOptions(connection, database) {
  return {
    type: 'postgres',
    host: connection.host,
    port: connection.port,
    username: connection.username,
    password: connection.password,
    database,
  };
}

async function createDatabases(connection, names) {
  const client = new Client({
    ...connection,
    user: connection.username,
    database: 'postgres',
  });
  await client.connect();
  try {
    for (const name of names) {
      await client.query(`CREATE DATABASE "${name}"`);
    }
  } finally {
    await client.end();
  }
}

async function waitForPostgres(connection) {
  let lastError;
  for (let attempt = 1; attempt <= 30; attempt += 1) {
    const client = new Client({
      ...connection,
      user: connection.username,
      database: 'postgres',
    });
    try {
      await client.connect();
      await client.query('SELECT 1');
      await client.end();
      return;
    } catch (error) {
      lastError = error;
      await client.end().catch(() => undefined);
      await delay(1_000);
    }
  }
  throw new Error(`PostgreSQL did not become ready: ${String(lastError)}`);
}

function loadBuiltArtifacts() {
  const fromDist = (...segments) =>
    require(path.join(workspaceRoot, 'dist', 'libs', ...segments));

  return {
    authSchemaMigration: fromDist(
      'auth/nest/src/infrastructure-persistence/migrations/1720200000000-create-auth-schema.js',
    ).CreateAuthSchema1720200000000,
    passkeysMigration: fromDist(
      'auth/nest/src/infrastructure-engine/better-auth/plugins/passkeys/migrations/1760200001000-create-better-auth-passkeys-table.js',
    ).CreateBetterAuthPasskeysTable1760200001000,
    accountIssuerMigration: fromDist(
      'auth/nest/src/infrastructure-persistence/migrations/1788275931000-add-better-auth-account-issuer.js',
    ).AddBetterAuthAccountIssuer1788275931000,
    formsSchemaMigration: fromDist(
      'forms/nest/src/infrastructure-persistence/migrations/1720300000000-create-forms-tables.js',
    ).CreateFormsTables1720300000000,
    formsValidationMigration: fromDist(
      'forms/nest/src/infrastructure-persistence/migrations/1720310000000-add-validation-rules-to-form-configs.js',
    ).AddValidationRulesToFormConfigs1720310000000,
    identitySchemaMigration: fromDist(
      'identity/nest/src/infrastructure-persistence/migrations/1720400000000-create-identity-schema.js',
    ).CreateIdentitySchema1720400000000,
    formConfigEntity: fromDist(
      'forms/nest/src/infrastructure-persistence/entities/form-config.entity.js',
    ).FormConfigEntity,
    submissionEntity: fromDist(
      'forms/nest/src/infrastructure-persistence/entities/submission.entity.js',
    ).SubmissionEntity,
    formConfigsRepository: fromDist(
      'forms/nest/src/infrastructure-persistence/repositories/typeorm-form-configs.repository.js',
    ).TypeOrmFormConfigsRepository,
    submissionsRepository: fromDist(
      'forms/nest/src/infrastructure-persistence/repositories/typeorm-submissions.repository.js',
    ).TypeOrmSubmissionsRepository,
    userProfileEntity: fromDist(
      'identity/nest/src/infrastructure-persistence/entities/user-profile.entity.js',
    ).UserProfileEntity,
    userProfilesRepository: fromDist(
      'identity/nest/src/infrastructure-persistence/repositories/typeorm-user-profiles.repository.js',
    ).TypeormUserProfilesRepository,
  };
}

main().catch((error) => {
  console.error('TypeORM 1.1 persistence compatibility smoke failed.');
  console.error(error);
  process.exit(1);
});
