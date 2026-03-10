import { DynamicModule, Inject, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { InvalidatedTokenEntity } from './entities/invalidated-token.entity';
import { PermissionEntity } from './entities/permission.entity';
import { RoleEntity } from './entities/role.entity';
import { UserEntity } from './entities/user.entity';
import {
  AUTH_PERSISTENCE_MODULE_OPTIONS,
  ConfigurableModuleClass,
  OPTIONS_TYPE,
} from './persistence.module-definition';
import { AuthUserRepository } from './repositories/auth-user.repository';
import { TypeormAuthUserRepository } from './repositories/typeorm-auth-user.repository';

@Module({})
export class AuthPersistenceModule extends ConfigurableModuleClass {
  constructor(
    @Inject(AUTH_PERSISTENCE_MODULE_OPTIONS) private options: string | symbol,
  ) {
    super();
  }

  static forRoot(options: typeof OPTIONS_TYPE): DynamicModule {
    switch (options.persistence) {
      case 'typeorm':
        return {
          ...super.forRoot(options),
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
        throw new Error(`Unsupported persistence type: ${options.persistence}`);
    }
  }
}
