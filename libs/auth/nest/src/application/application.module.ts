import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import type { AuthApplicationModuleOptions } from '../config';
import {
  authConfig,
  AuthConfig,
  mapAuthConfigToApplicationModuleOptions,
  resolveAuthApplicationModuleOptions,
} from '../config';
import { BetterAuthAuthEngineAdapter } from '../infrastructure-engine/better-auth/better-auth-auth-engine.adapter';
import { BetterAuthIsolatedPersistenceAdapter } from '../infrastructure-engine/better-auth/better-auth-isolated-persistence.adapter';
import { BetterAuthTypeormAdapterPersistenceAdapter } from '../infrastructure-engine/better-auth/better-auth-typeorm-adapter-persistence.adapter';
import { LegacyJwtAuthEngineAdapter } from '../infrastructure-engine/legacy-jwt-auth-engine.adapter';
import { AuthPersistenceModule } from '../infrastructure-persistence';
import {
  ConfigurableModuleClass,
  OPTIONS_TYPE,
} from './application.module-definition';
import { AbilityFactory } from './factories/ability.factory';
import { AUTH_RESOURCE_AUTHORIZATION_LOADERS } from './resource-authorization.tokens';
import { AuthEnginePort } from './services/auth-engine.port';
import { AuthEnginePersistencePort } from './services/auth-engine-persistence.port';
import { AuthOrchestrationService } from './services/auth-orchestration.service';
import { AuthService } from './services/auth.service';
import { BcryptHashService } from './services/bcrypt-hash.service';
import { HashService } from './services/hash.service';
import { JwtAuthService } from './services/jwt-auth.service';
import { PoliciesService } from './services/policies.service';
import { JwtStrategy } from './strategies/jwt-strategy';

@Module({})
export class AuthApplicationModule extends ConfigurableModuleClass {
  static forRoot(options: AuthApplicationModuleOptions = {}): DynamicModule {
    const resolvedOptions: typeof OPTIONS_TYPE =
      resolveAuthApplicationModuleOptions(options);
    const {
      authStrategies,
      engine,
      encryption,
      persistence,
      resourceAuthorization,
    } = resolvedOptions;
    const imports = [
      ConfigModule.forFeature(authConfig),
      AuthPersistenceModule.forRoot(persistence),
    ];
    const providers = [];
    const exports = [];

    providers.push(AbilityFactory, PoliciesService, {
      provide: AUTH_RESOURCE_AUTHORIZATION_LOADERS,
      useValue: resourceAuthorization.loaders,
    });
    exports.push(AUTH_RESOURCE_AUTHORIZATION_LOADERS, PoliciesService);

    switch (encryption.algorithm) {
      case 'bcrypt':
        providers.push(BcryptHashService, {
          provide: HashService,
          useExisting: BcryptHashService,
        });
        exports.push(HashService);
        break;
      case 'argon2':
        // Future implementation for Argon2HashService can be added here
        throw new Error('Argon2HashService not implemented yet');
      default:
        throw new Error(
          `Unsupported encryption algorithm: ${encryption.algorithm}`,
        );
    }

    if (authStrategies.includes('jwt')) {
      imports.push(
        JwtModule.registerAsync({
          imports: [ConfigModule.forFeature(authConfig)],
          inject: [authConfig.KEY],
          useFactory: (authConfig: AuthConfig) => ({
            secret: authConfig.jwtSecret,
            signOptions: {
              expiresIn: parseInt(authConfig.jwtExpiration, 10),
              audience: authConfig.jwtAudience,
              issuer: authConfig.jwtIssuer,
            },
          }),
        }),
      );

      providers.push(
        AuthOrchestrationService,
        JwtStrategy,
        {
          provide: AuthService,
          useExisting: AuthOrchestrationService,
        },
        {
          provide: JwtAuthService,
          useExisting: AuthOrchestrationService,
        },
      );
      exports.push(AuthService);
    }

    if (engine === 'better-auth') {
      switch (resolvedOptions.engineOptions.persistence.mode) {
        case 'isolated':
          providers.push(
            BetterAuthIsolatedPersistenceAdapter,
            {
              provide: AuthEnginePersistencePort,
              useExisting: BetterAuthIsolatedPersistenceAdapter,
            },
            BetterAuthAuthEngineAdapter,
            {
              provide: AuthEnginePort,
              useExisting: BetterAuthAuthEngineAdapter,
            },
          );
          break;
        case 'typeorm-adapter':
          providers.push(
            BetterAuthTypeormAdapterPersistenceAdapter,
            {
              provide: AuthEnginePersistencePort,
              useExisting: BetterAuthTypeormAdapterPersistenceAdapter,
            },
            BetterAuthAuthEngineAdapter,
            {
              provide: AuthEnginePort,
              useExisting: BetterAuthAuthEngineAdapter,
            },
          );
          break;
        default:
          throw new Error(
            `Unsupported auth engine persistence mode: ${resolvedOptions.engineOptions.persistence.mode}`,
          );
      }
    } else {
      providers.push(LegacyJwtAuthEngineAdapter, {
        provide: AuthEnginePort,
        useExisting: LegacyJwtAuthEngineAdapter,
      });
    }

    return {
      ...super.forRoot(resolvedOptions),
      imports,
      providers,
      exports,
    };
  }

  static forRootFromConfig(
    overrides: AuthApplicationModuleOptions = {},
  ): DynamicModule {
    const configOptions = mapAuthConfigToApplicationModuleOptions(authConfig());
    const moduleDefinition = this.forRoot({
      ...configOptions,
      ...overrides,
      encryption: {
        ...configOptions.encryption,
        ...overrides.encryption,
      },
      engineOptions: {
        ...configOptions.engineOptions,
        ...overrides.engineOptions,
        persistence: {
          ...configOptions.engineOptions?.persistence,
          ...overrides.engineOptions?.persistence,
          separateDatabase: {
            ...configOptions.engineOptions?.persistence?.separateDatabase,
            ...overrides.engineOptions?.persistence?.separateDatabase,
          },
        },
      },
      persistence: {
        ...configOptions.persistence,
        ...overrides.persistence,
      },
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
