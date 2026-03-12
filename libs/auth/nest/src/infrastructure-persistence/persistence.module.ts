import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvalidatedTokenEntity } from './entities/invalidated-token.entity';
import { PermissionEntity } from './entities/permission.entity';
import { RoleEntity } from './entities/role.entity';
import { UserEntity } from './entities/user.entity';
import {
  ConfigurableModuleClass,
  OPTIONS_TYPE,
} from './persistence.module-definition';
import { AuthUserRepository } from './repositories/auth-user.repository';
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

    switch (resolvedOptions.persistence) {
      case 'typeorm':
        return {
          ...super.forRoot(resolvedOptions),
          imports: [
            TypeOrmModule.forFeature([
              UserEntity,
              RoleEntity,
              PermissionEntity,
              InvalidatedTokenEntity,
            ]),
          ],
          providers: [
            TypeormAuthUserRepository,
            {
              provide: AuthUserRepository,
              useExisting: TypeormAuthUserRepository,
            },
          ],
          exports: [AuthUserRepository, TypeOrmModule],
        };
      default:
        throw new Error(
          `Unsupported persistence type: ${resolvedOptions.persistence}`,
        );
    }
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
