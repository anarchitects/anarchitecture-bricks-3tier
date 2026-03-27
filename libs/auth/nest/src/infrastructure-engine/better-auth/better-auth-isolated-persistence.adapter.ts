import { Inject, Injectable, Optional } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import { Pool, type PoolConfig } from 'pg';
import type { DataSource } from 'typeorm';
import { AUTH_APPLICATION_MODULE_OPTIONS } from '../../application/application.module-definition';
import { AuthEnginePersistencePort } from '../../application/services/auth-engine-persistence.port';
import type { ResolvedAuthApplicationModuleOptions } from '../../config';
import { AUTH_SCHEMA } from '../../infrastructure-persistence/schema';
import { loadBetterAuthRuntimeModules } from './better-auth.module-loader';
import { createBetterAuthOptions } from './better-auth-options';

type TypeOrmPostgresOptions = {
  type?: unknown;
  url?: unknown;
  host?: unknown;
  port?: unknown;
  username?: unknown;
  password?: unknown;
  database?: unknown;
  ssl?: unknown;
  extra?: Record<string, unknown>;
};

@Injectable()
export class BetterAuthIsolatedPersistenceAdapter
  implements AuthEnginePersistencePort
{
  private resolvedDatabasePromise: Promise<unknown> | null = null;

  constructor(
    @Inject(AUTH_APPLICATION_MODULE_OPTIONS)
    private readonly options: ResolvedAuthApplicationModuleOptions,
    @Optional()
    @Inject(getDataSourceToken())
    private readonly dataSource?: DataSource,
  ) {}

  resolveDatabase(): Promise<unknown> {
    if (!this.resolvedDatabasePromise) {
      this.resolvedDatabasePromise = this.createDatabase();
    }

    return this.resolvedDatabasePromise;
  }

  private async createDatabase(): Promise<Pool> {
    const pool = new Pool(this.getPoolConfig());

    try {
      await pool.query(`CREATE SCHEMA IF NOT EXISTS ${AUTH_SCHEMA}`);

      const runtimeModules = await loadBetterAuthRuntimeModules();
      const betterAuthOptions = createBetterAuthOptions(
        this.options,
        pool,
        runtimeModules,
      );
      const { runMigrations } =
        await runtimeModules.betterAuthMigration.getMigrations(
          betterAuthOptions,
        );

      await runMigrations();

      return pool;
    } catch (error) {
      await pool.end().catch(() => undefined);
      throw error;
    }
  }

  private getPoolConfig(): PoolConfig {
    switch (this.options.engineOptions.persistence.isolatedTopology) {
      case 'same-db':
        return this.getSameDatabasePoolConfig();
      case 'separate-db':
        return this.getSeparateDatabasePoolConfig();
      default:
        throw new Error(
          `Unsupported auth engine isolated topology: ${this.options.engineOptions.persistence.isolatedTopology}`,
        );
    }
  }

  private getSameDatabasePoolConfig(): PoolConfig {
    if (!this.dataSource) {
      throw new Error(
        'Better Auth isolated same-db persistence requires an active TypeORM DataSource.',
      );
    }

    const dataSourceOptions = this.dataSource
      .options as unknown as TypeOrmPostgresOptions;

    if (dataSourceOptions.type !== 'postgres') {
      throw new Error(
        `Better Auth isolated same-db persistence requires a PostgreSQL TypeORM DataSource. Received: ${String(
          dataSourceOptions.type ?? 'unknown',
        )}`,
      );
    }

    const ssl = this.getSslConfig(dataSourceOptions);
    const options = this.buildSearchPathOptions(
      dataSourceOptions.extra?.['options'],
    );

    if (typeof dataSourceOptions.url === 'string' && dataSourceOptions.url) {
      return {
        connectionString: dataSourceOptions.url,
        ssl,
        options,
      };
    }

    const missingFields = [
      ['host', dataSourceOptions.host],
      ['username', dataSourceOptions.username],
      ['password', dataSourceOptions.password],
      ['database', dataSourceOptions.database],
    ]
      .filter(([, value]) => typeof value !== 'string' || value.length === 0)
      .map(([field]) => field);

    if (missingFields.length > 0) {
      throw new Error(
        `Better Auth isolated same-db persistence requires PostgreSQL connection details on the TypeORM DataSource. Missing: ${missingFields.join(', ')}`,
      );
    }

    return {
      host: dataSourceOptions.host as string,
      port:
        typeof dataSourceOptions.port === 'number'
          ? dataSourceOptions.port
          : Number.parseInt(String(dataSourceOptions.port ?? ''), 10) || 5432,
      user: dataSourceOptions.username as string,
      password: dataSourceOptions.password as string,
      database: dataSourceOptions.database as string,
      ssl,
      options,
    };
  }

  private getSeparateDatabasePoolConfig(): PoolConfig {
    const separateDatabase =
      this.options.engineOptions.persistence.separateDatabase;

    return {
      host: separateDatabase.host,
      port: separateDatabase.port,
      user: separateDatabase.username,
      password: separateDatabase.password,
      database: separateDatabase.database,
      ssl: separateDatabase.ssl ? true : undefined,
      options: this.buildSearchPathOptions(undefined),
    };
  }

  private getSslConfig(
    dataSourceOptions: TypeOrmPostgresOptions,
  ): PoolConfig['ssl'] {
    if (dataSourceOptions.ssl !== undefined) {
      return dataSourceOptions.ssl as PoolConfig['ssl'];
    }

    return dataSourceOptions.extra?.['ssl'] as PoolConfig['ssl'] | undefined;
  }

  private buildSearchPathOptions(existingOptions: unknown): string {
    const searchPathClause = `-c search_path=${AUTH_SCHEMA}`;
    if (typeof existingOptions !== 'string' || existingOptions.length === 0) {
      return searchPathClause;
    }

    if (existingOptions.includes(searchPathClause)) {
      return existingOptions;
    }

    return `${existingOptions} ${searchPathClause}`.trim();
  }
}
