import { DynamicModule } from '@nestjs/common';
import { AuthApplicationModule } from './application.module';
import { LegacyJwtAuthEngineAdapter } from '../infrastructure-engine/legacy-jwt-auth-engine.adapter';
import { AUTH_RESOURCE_AUTHORIZATION_LOADERS } from './resource-authorization.tokens';
import { AuthEnginePort } from './services/auth-engine.port';
import { AuthOrchestrationService } from './services/auth-orchestration.service';
import { AuthPersistenceModule } from '../infrastructure-persistence';
import { AuthService } from './services/auth.service';
import { JwtAuthService } from './services/jwt-auth.service';

const ORIGINAL_AUTH_PERSISTENCE = process.env['AUTH_PERSISTENCE'];
const ORIGINAL_AUTH_STRATEGIES = process.env['AUTH_STRATEGIES'];

describe('AuthApplicationModule', () => {
  afterEach(() => {
    if (ORIGINAL_AUTH_PERSISTENCE === undefined) {
      delete process.env['AUTH_PERSISTENCE'];
    } else {
      process.env['AUTH_PERSISTENCE'] = ORIGINAL_AUTH_PERSISTENCE;
    }

    if (ORIGINAL_AUTH_STRATEGIES === undefined) {
      delete process.env['AUTH_STRATEGIES'];
    } else {
      process.env['AUTH_STRATEGIES'] = ORIGINAL_AUTH_STRATEGIES;
    }
  });

  it('should compose persistence forRoot options when overrides are provided', () => {
    const loaders = {
      Post: jest.fn(),
    };
    const moduleMetadata = AuthApplicationModule.forRoot({
      engine: 'better-auth',
      sessionMode: 'session',
      features: {
        passkeys: true,
        social: true,
      },
      spike: {
        proofHarnessEnabled: true,
      },
      authStrategies: ['jwt'],
      encryption: {
        algorithm: 'bcrypt',
        key: 'explicit-key',
      },
      persistence: { persistence: 'typeorm' },
      resourceAuthorization: { loaders },
    });

    expect(moduleMetadata.module).toBe(AuthApplicationModule);
    const [configImport, persistenceImport] =
      moduleMetadata.imports as DynamicModule[];
    expect(configImport).toBeDefined();
    expect(persistenceImport.module).toBe(AuthPersistenceModule);
    expect(moduleMetadata.providers).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          provide: AUTH_RESOURCE_AUTHORIZATION_LOADERS,
          useValue: loaders,
        }),
      ]),
    );
  });

  it('should resolve AUTH_PERSISTENCE through forRootFromConfig', () => {
    process.env['AUTH_PERSISTENCE'] = 'unsupported';

    expect(() => AuthApplicationModule.forRootFromConfig()).toThrow(
      'Unsupported persistence type: unsupported',
    );
  });

  it('should let explicit forRootFromConfig overrides win over env defaults', () => {
    process.env['AUTH_PERSISTENCE'] = 'unsupported';

    const moduleMetadata = AuthApplicationModule.forRootFromConfig({
      engine: 'legacy-jwt',
      persistence: { persistence: 'typeorm' },
    });

    expect(moduleMetadata.module).toBe(AuthApplicationModule);
  });

  it('should keep forRoot explicit and ignore AUTH_STRATEGIES', () => {
    process.env['AUTH_STRATEGIES'] = 'custom';
    const moduleMetadata = AuthApplicationModule.forRoot({
      encryption: {
        algorithm: 'bcrypt',
        key: 'explicit-key',
      },
    });

    expect(moduleMetadata.exports).toContain(AuthService);
  });

  it('should wire AuthService and AuthEnginePort through the orchestration seam', () => {
    const moduleMetadata = AuthApplicationModule.forRoot({
      authStrategies: ['jwt'],
      encryption: {
        algorithm: 'bcrypt',
        key: 'explicit-key',
      },
      persistence: { persistence: 'typeorm' },
    });

    expect(moduleMetadata.providers).toEqual(
      expect.arrayContaining([
        AuthOrchestrationService,
        LegacyJwtAuthEngineAdapter,
        expect.objectContaining({
          provide: AuthEnginePort,
          useExisting: LegacyJwtAuthEngineAdapter,
        }),
        expect.objectContaining({
          provide: AuthService,
          useExisting: AuthOrchestrationService,
        }),
        expect.objectContaining({
          provide: JwtAuthService,
          useExisting: AuthOrchestrationService,
        }),
      ]),
    );
  });

  it('should resolve AUTH_STRATEGIES through forRootFromConfig', () => {
    process.env['AUTH_STRATEGIES'] = 'custom';
    const moduleMetadata = AuthApplicationModule.forRootFromConfig();

    expect(moduleMetadata.exports).not.toContain(AuthService);
  });

  it('should allow a better-auth engine without changing the public AuthService export', () => {
    const moduleMetadata = AuthApplicationModule.forRoot({
      engine: 'better-auth',
      authStrategies: ['jwt'],
      spike: {
        proofHarnessEnabled: true,
      },
    });

    expect(moduleMetadata.exports).toContain(AuthService);
  });
});
