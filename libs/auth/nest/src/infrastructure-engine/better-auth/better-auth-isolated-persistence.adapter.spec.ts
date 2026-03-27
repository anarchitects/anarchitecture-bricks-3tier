import { Pool } from 'pg';
import type { DataSource } from 'typeorm';
import type { ResolvedAuthApplicationModuleOptions } from '../../config';
import { BetterAuthIsolatedPersistenceAdapter } from './better-auth-isolated-persistence.adapter';
import { loadBetterAuthRuntimeModules } from './better-auth.module-loader';

jest.mock('pg', () => ({
  Pool: jest.fn(),
}));

jest.mock('./better-auth.module-loader', () => ({
  loadBetterAuthRuntimeModules: jest.fn(),
}));

describe('BetterAuthIsolatedPersistenceAdapter', () => {
  const poolQuery = jest.fn();
  const poolEnd = jest.fn();
  const runMigrations = jest.fn();
  const getMigrations = jest.fn();
  const passkey = jest.fn();

  const baseOptions = {
    authStrategies: ['jwt'],
    engine: 'better-auth',
    sessionMode: 'session',
    engineOptions: {
      persistence: {
        mode: 'isolated',
        isolatedTopology: 'same-db',
        separateDatabase: {
          host: undefined,
          port: 5432,
          username: undefined,
          password: undefined,
          database: undefined,
          ssl: false,
        },
      },
    },
    features: {
      passkeys: false,
      social: false,
      oidc: false,
    },
    spike: {
      baseUrl: 'http://localhost:3000/api/auth',
      secret: 'better-auth-spike-secret-32-chars-minimum',
      proofHarnessEnabled: true,
      socialProviders: {
        github: undefined,
      },
      passkeys: {
        rpID: 'localhost',
        rpName: 'Anarchitecture Auth Spike',
        origin: undefined,
      },
    },
    encryption: {
      algorithm: 'bcrypt',
      key: 'default_encryption_key',
    },
    persistence: {
      persistence: 'typeorm',
    },
    resourceAuthorization: {
      loaders: {},
    },
  } satisfies ResolvedAuthApplicationModuleOptions;

  beforeEach(() => {
    jest.clearAllMocks();

    const poolConstructorMock = Pool as unknown as jest.Mock;
    poolConstructorMock.mockImplementation(() => ({
      query: poolQuery,
      end: poolEnd,
    }));

    getMigrations.mockResolvedValue({
      runMigrations,
    });

    (loadBetterAuthRuntimeModules as jest.Mock).mockResolvedValue({
      betterAuth: {
        betterAuth: jest.fn(),
      },
      betterAuthPasskey: {
        passkey,
      },
      betterAuthMigration: {
        getMigrations,
      },
    });
  });

  it('derives same-db Postgres pool options from the TypeORM DataSource', async () => {
    const dataSource = {
      options: {
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        password: 'postgres',
        database: 'app_db',
        ssl: { rejectUnauthorized: false },
        extra: {
          options: '-c statement_timeout=5000',
        },
      },
    } as DataSource;

    const adapter = new BetterAuthIsolatedPersistenceAdapter(
      baseOptions,
      dataSource,
    );

    const database = await adapter.resolveDatabase();

    expect(database).toBeDefined();
    expect(Pool).toHaveBeenCalledWith({
      host: 'localhost',
      port: 5432,
      user: 'postgres',
      password: 'postgres',
      database: 'app_db',
      ssl: { rejectUnauthorized: false },
      options: '-c statement_timeout=5000 -c search_path=auth',
    });
    expect(poolQuery).toHaveBeenCalledWith('CREATE SCHEMA IF NOT EXISTS auth');
    expect(getMigrations).toHaveBeenCalledWith(
      expect.objectContaining({
        database,
      }),
    );
    expect(runMigrations).toHaveBeenCalled();
  });

  it('supports same-db url-based TypeORM DataSource options', async () => {
    const dataSource = {
      options: {
        type: 'postgres',
        url: 'postgres://postgres:postgres@localhost:5432/app_db',
      },
    } as DataSource;

    const adapter = new BetterAuthIsolatedPersistenceAdapter(
      baseOptions,
      dataSource,
    );

    await adapter.resolveDatabase();

    expect(Pool).toHaveBeenCalledWith({
      connectionString: 'postgres://postgres:postgres@localhost:5432/app_db',
      ssl: undefined,
      options: '-c search_path=auth',
    });
  });

  it('fails fast when same-db is selected without a TypeORM DataSource', async () => {
    const adapter = new BetterAuthIsolatedPersistenceAdapter(baseOptions);

    await expect(adapter.resolveDatabase()).rejects.toThrow(
      'Better Auth isolated same-db persistence requires an active TypeORM DataSource.',
    );
  });

  it('fails fast when same-db is selected with a non-PostgreSQL DataSource', async () => {
    const dataSource = {
      options: {
        type: 'sqlite',
      },
    } as DataSource;

    const adapter = new BetterAuthIsolatedPersistenceAdapter(
      baseOptions,
      dataSource,
    );

    await expect(adapter.resolveDatabase()).rejects.toThrow(
      'Better Auth isolated same-db persistence requires a PostgreSQL TypeORM DataSource. Received: sqlite',
    );
  });

  it('builds separate-db pool options from engine persistence config', async () => {
    const adapter = new BetterAuthIsolatedPersistenceAdapter({
      ...baseOptions,
      engineOptions: {
        persistence: {
          ...baseOptions.engineOptions.persistence,
          isolatedTopology: 'separate-db',
          separateDatabase: {
            host: 'db.example.test',
            port: 6543,
            username: 'auth_user',
            password: 'auth_pass',
            database: 'auth_db',
            ssl: true,
          },
        },
      },
    });

    await adapter.resolveDatabase();

    expect(Pool).toHaveBeenCalledWith({
      host: 'db.example.test',
      port: 6543,
      user: 'auth_user',
      password: 'auth_pass',
      database: 'auth_db',
      ssl: true,
      options: '-c search_path=auth',
    });
  });

  it('caches the resolved pool and migration bootstrap per provider instance', async () => {
    const dataSource = {
      options: {
        type: 'postgres',
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        password: 'postgres',
        database: 'app_db',
      },
    } as DataSource;

    const adapter = new BetterAuthIsolatedPersistenceAdapter(
      baseOptions,
      dataSource,
    );

    const [firstDatabase, secondDatabase] = await Promise.all([
      adapter.resolveDatabase(),
      adapter.resolveDatabase(),
    ]);

    expect(firstDatabase).toBe(secondDatabase);
    expect(Pool).toHaveBeenCalledTimes(1);
    expect(getMigrations).toHaveBeenCalledTimes(1);
    expect(runMigrations).toHaveBeenCalledTimes(1);
  });
});
