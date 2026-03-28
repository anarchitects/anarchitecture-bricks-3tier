import { JwtModule } from '@nestjs/jwt';
import { AuthApplicationModule } from './application.module';
import { AUTH_RESOURCE_AUTHORIZATION_LOADERS } from './resource-authorization.tokens';
import { AuthEnginePort } from './services/auth-engine.port';
import { BetterAuthDatabasePort } from './services/better-auth-database.port';
import { AuthOrchestrationService } from './services/auth-orchestration.service';
import { AuthPersistenceModule } from '../infrastructure-persistence';
import { AuthService } from './services/auth.service';
import { BetterAuthAuthEngineAdapter } from '../infrastructure-engine/better-auth/better-auth-auth-engine.adapter';
import { BetterAuthJwtTypeormSupportModule } from '../infrastructure-engine/better-auth/plugins/jwt/better-auth-jwt-typeorm-support.module';
import { BetterAuthTypeormDatabaseAdapter } from '../infrastructure-engine/better-auth/better-auth-typeorm-adapter-persistence.adapter';
import { BetterAuthJwtPluginService } from '../infrastructure-engine/better-auth/plugins/jwt/better-auth-jwt-plugin.service';
import { BetterAuthPasskeysTypeormSupportModule } from '../infrastructure-engine/better-auth/plugins/passkeys/better-auth-passkeys-typeorm-support.module';

describe('AuthApplicationModule', () => {
  it('composes the Better Auth core application module', () => {
    const loaders = {
      Post: jest.fn(),
    };

    const moduleMetadata = AuthApplicationModule.forRoot({
      encryption: {
        algorithm: 'bcrypt',
        key: 'explicit-key',
      },
      resourceAuthorization: { loaders },
    });

    expect(moduleMetadata.module).toBe(AuthApplicationModule);
    expect(moduleMetadata.imports).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ module: AuthPersistenceModule }),
      ]),
    );
    expect(moduleMetadata.providers).toEqual(
      expect.arrayContaining([
        AuthOrchestrationService,
        BetterAuthTypeormDatabaseAdapter,
        BetterAuthAuthEngineAdapter,
        expect.objectContaining({
          provide: AUTH_RESOURCE_AUTHORIZATION_LOADERS,
          useValue: loaders,
        }),
        expect.objectContaining({
          provide: BetterAuthDatabasePort,
          useExisting: BetterAuthTypeormDatabaseAdapter,
        }),
        expect.objectContaining({
          provide: AuthEnginePort,
          useExisting: BetterAuthAuthEngineAdapter,
        }),
        expect.objectContaining({
          provide: AuthService,
          useExisting: AuthOrchestrationService,
        }),
      ]),
    );
  });

  it('enables JWT plugin wiring only when configured', () => {
    const moduleMetadata = AuthApplicationModule.forRoot({
      plugins: {
        jwt: {
          enabled: true,
          secret: 'jwt-secret',
        },
      },
    });

    expect(moduleMetadata.imports).toEqual(
      expect.arrayContaining([
        BetterAuthJwtTypeormSupportModule,
        expect.objectContaining({ module: JwtModule }),
      ]),
    );
    expect(moduleMetadata.providers).toEqual(
      expect.arrayContaining([BetterAuthJwtPluginService]),
    );
  });

  it('enables passkey plugin support only when configured', () => {
    const moduleMetadata = AuthApplicationModule.forRoot({
      plugins: {
        passkeys: {
          enabled: true,
        },
      },
    });

    expect(moduleMetadata.imports).toContain(BetterAuthPasskeysTypeormSupportModule);
  });

  it('lets explicit forRootFromConfig overrides win over config defaults', () => {
    const moduleMetadata = AuthApplicationModule.forRootFromConfig({
      plugins: {
        jwt: {
          enabled: true,
          secret: 'override-secret',
        },
      },
      betterAuth: {
        baseUrl: 'http://localhost:3100/api/auth',
      },
    });

    expect(moduleMetadata.module).toBe(AuthApplicationModule);
    expect(moduleMetadata.imports).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ module: JwtModule }),
      ]),
    );
  });

  it('keeps forRootFromConfig deterministic without legacy persistence env handling', () => {
    const moduleMetadata = AuthApplicationModule.forRootFromConfig();
    expect(moduleMetadata.module).toBe(AuthApplicationModule);
  });
});
