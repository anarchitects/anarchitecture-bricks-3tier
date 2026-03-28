import { DynamicModule, Module, Type } from '@nestjs/common';
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
import { BetterAuthJwtPluginService } from '../infrastructure-engine/better-auth/plugins/jwt/better-auth-jwt-plugin.service';
import { BetterAuthJwtTypeormSupportModule } from '../infrastructure-engine/better-auth/plugins/jwt/better-auth-jwt-typeorm-support.module';
import { BetterAuthPasskeysTypeormSupportModule } from '../infrastructure-engine/better-auth/plugins/passkeys/better-auth-passkeys-typeorm-support.module';
import { BetterAuthTypeormDatabaseAdapter } from '../infrastructure-engine/better-auth/better-auth-typeorm-adapter-persistence.adapter';
import { AuthPersistenceModule } from '../infrastructure-persistence';
import {
  ConfigurableModuleClass,
  OPTIONS_TYPE,
} from './application.module-definition';
import { AbilityFactory } from './factories/ability.factory';
import { AUTH_RESOURCE_AUTHORIZATION_LOADERS } from './resource-authorization.tokens';
import { AuthEnginePort } from './services/auth-engine.port';
import { BetterAuthDatabasePort } from './services/better-auth-database.port';
import { AuthOrchestrationService } from './services/auth-orchestration.service';
import { AuthService } from './services/auth.service';
import { BcryptHashService } from './services/bcrypt-hash.service';
import { HashService } from './services/hash.service';
import { PoliciesService } from './services/policies.service';

@Module({})
export class AuthApplicationModule extends ConfigurableModuleClass {
  static forRoot(options: AuthApplicationModuleOptions = {}): DynamicModule {
    const resolvedOptions: typeof OPTIONS_TYPE =
      resolveAuthApplicationModuleOptions(options);
    const { encryption, resourceAuthorization } = resolvedOptions;
    const imports: Array<DynamicModule | Type<unknown>> = [
      ConfigModule.forFeature(authConfig),
      AuthPersistenceModule.forRoot(),
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

    if (resolvedOptions.plugins.jwt.enabled) {
      imports.push(BetterAuthJwtTypeormSupportModule);
      imports.push(
        JwtModule.registerAsync({
          imports: [ConfigModule.forFeature(authConfig)],
          inject: [authConfig.KEY],
          useFactory: (config: AuthConfig) => ({
            secret: config.plugins.jwt.secret,
            signOptions: {
              expiresIn: config.plugins.jwt.expiration as never,
              audience: config.plugins.jwt.audience,
              issuer: config.plugins.jwt.issuer,
            },
          }),
        }),
      );
    }

    if (resolvedOptions.plugins.passkeys.enabled) {
      imports.push(BetterAuthPasskeysTypeormSupportModule);
    }

    providers.push(
      AuthOrchestrationService,
      {
        provide: AuthService,
        useExisting: AuthOrchestrationService,
      },
      BetterAuthTypeormDatabaseAdapter,
      {
        provide: BetterAuthDatabasePort,
        useExisting: BetterAuthTypeormDatabaseAdapter,
      },
      BetterAuthAuthEngineAdapter,
      {
        provide: AuthEnginePort,
        useExisting: BetterAuthAuthEngineAdapter,
      },
    );
    exports.push(AuthService);

    if (resolvedOptions.plugins.jwt.enabled) {
      providers.push(BetterAuthJwtPluginService);
    }

    const baseModule = super.forRoot(resolvedOptions);

    return {
      ...baseModule,
      imports: [...(baseModule.imports ?? []), ...imports],
      providers: [...(baseModule.providers ?? []), ...providers],
      exports: [...(baseModule.exports ?? []), ...exports],
    };
  }

  static forRootFromConfig(
    overrides: AuthApplicationModuleOptions = {},
  ): DynamicModule {
    const configOptions = mapAuthConfigToApplicationModuleOptions(authConfig());
    const moduleDefinition = this.forRoot({
      ...configOptions,
      ...overrides,
      betterAuth: {
        ...configOptions.betterAuth,
        ...overrides.betterAuth,
        callbackUrls: {
          ...configOptions.betterAuth?.callbackUrls,
          ...overrides.betterAuth?.callbackUrls,
        },
      },
      encryption: {
        ...configOptions.encryption,
        ...overrides.encryption,
      },
      plugins: {
        ...configOptions.plugins,
        ...overrides.plugins,
        jwt: {
          ...configOptions.plugins?.jwt,
          ...overrides.plugins?.jwt,
        },
        passkeys: {
          ...configOptions.plugins?.passkeys,
          ...overrides.plugins?.passkeys,
        },
        social: {
          ...configOptions.plugins?.social,
          ...overrides.plugins?.social,
        },
        oidc: {
          ...configOptions.plugins?.oidc,
          ...overrides.plugins?.oidc,
        },
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
