import { Inject, Injectable, Optional } from '@nestjs/common';
import { getDataSourceToken } from '@nestjs/typeorm';
import type { BetterAuthOptions } from 'better-auth';
import type { DataSource, EntityTarget, ObjectLiteral } from 'typeorm';
import { AUTH_APPLICATION_MODULE_OPTIONS } from '../../application/application.module-definition';
import { BetterAuthDatabasePort } from '../../application/services/better-auth-database.port';
import type { ResolvedAuthApplicationModuleOptions } from '../../config';
import { AccountEntity } from '../../infrastructure-persistence/entities/account.entity';
import { AuthUserEntity } from '../../infrastructure-persistence/entities/auth-user.entity';
import { SessionEntity } from '../../infrastructure-persistence/entities/session.entity';
import { VerificationEntity } from '../../infrastructure-persistence/entities/verification.entity';
import { loadBetterAuthTypeormAdapterModule } from './better-auth.module-loader';
import { PasskeyEntity } from './plugins/passkeys/passkey.entity';

const ADAPTER_ID = 'anarchitects-typeorm';
const ADAPTER_NAME = 'Anarchitects TypeORM Adapter';

type BetterAuthTypeormModelMap = Record<string, EntityTarget<ObjectLiteral>>;

@Injectable()
export class BetterAuthTypeormDatabaseAdapter
  implements BetterAuthDatabasePort
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
      this.resolvedDatabasePromise = this.createDatabaseAdapter();
    }

    return this.resolvedDatabasePromise;
  }

  private async createDatabaseAdapter(): Promise<
    BetterAuthOptions['database']
  > {
    if (!this.dataSource) {
      throw new Error(
        'Better Auth TypeORM adapter persistence requires an active TypeORM DataSource.',
      );
    }

    const adapterModule = await loadBetterAuthTypeormAdapterModule();

    return adapterModule.createBetterAuthTypeormAdapter({
      dataSource: this.dataSource,
      models: createBetterAuthTypeormModels(this.options),
      adapterId: ADAPTER_ID,
      adapterName: ADAPTER_NAME,
    });
  }
}

export function createBetterAuthTypeormModels(
  options: Pick<ResolvedAuthApplicationModuleOptions, 'plugins'>,
): BetterAuthTypeormModelMap {
  const models: BetterAuthTypeormModelMap = {
    users: AuthUserEntity,
    accounts: AccountEntity,
    sessions: SessionEntity,
    verifications: VerificationEntity,
  };

  if (options.plugins.passkeys.enabled) {
    models['passkeys'] = PasskeyEntity;
  }

  return models;
}
