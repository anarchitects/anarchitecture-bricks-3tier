import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AccountEntity } from './entities/account.entity';
import { PermissionEntity } from './entities/permission.entity';
import { RoleEntity } from './entities/role.entity';
import { SessionEntity } from './entities/session.entity';
import { UserEntity } from './entities/user.entity';
import { VerificationEntity } from './entities/verification.entity';
import {
  ConfigurableModuleClass,
  OPTIONS_TYPE,
} from './persistence.module-definition';
import { AuthUserRepository } from './repositories/auth-user.repository';
import { AuthAccountRepository } from './repositories/auth-account.repository';
import { TypeormAuthAccountRepository } from './repositories/typeorm-auth-account.repository';
import { TypeormAuthUserRepository } from './repositories/typeorm-auth-user.repository';
import {
  authConfig,
  mapAuthConfigToPersistenceModuleOptions,
  resolveAuthPersistenceModuleOptions,
} from '../config';
import type { AuthPersistenceModuleOptions } from '../config';

@Module({})
export class AuthPersistenceModule extends ConfigurableModuleClass {
  static forRoot(options: AuthPersistenceModuleOptions = {}): DynamicModule {
    const resolvedOptions: typeof OPTIONS_TYPE =
      resolveAuthPersistenceModuleOptions(options);

    return {
      ...super.forRoot(resolvedOptions),
      imports: [
        TypeOrmModule.forFeature([
          AccountEntity,
          SessionEntity,
          UserEntity,
          VerificationEntity,
          RoleEntity,
          PermissionEntity,
        ]),
      ],
      providers: [
        TypeormAuthAccountRepository,
        TypeormAuthUserRepository,
        {
          provide: AuthAccountRepository,
          useExisting: TypeormAuthAccountRepository,
        },
        {
          provide: AuthUserRepository,
          useExisting: TypeormAuthUserRepository,
        },
      ],
      exports: [AuthAccountRepository, AuthUserRepository, TypeOrmModule],
    };
  }

  static forRootFromConfig(
    overrides: AuthPersistenceModuleOptions = {},
  ): DynamicModule {
    const configOptions = mapAuthConfigToPersistenceModuleOptions(authConfig());
    const moduleDefinition = this.forRoot({
      ...configOptions,
      ...overrides,
    });

    return {
      ...moduleDefinition,
      imports: [
        ConfigModule.forFeature(authConfig),
        ...(moduleDefinition.imports ?? []),
      ],
    };
  }
}
