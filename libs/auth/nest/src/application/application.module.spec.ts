import { DynamicModule } from '@nestjs/common';
import { AuthApplicationModule } from './application.module';
import { LegacyJwtAuthEngineAdapter } from '../infrastructure-engine/legacy-jwt-auth-engine.adapter';
import { AUTH_RESOURCE_AUTHORIZATION_LOADERS } from './resource-authorization.tokens';
import { AuthEnginePort } from './services/auth-engine.port';
import { AuthEnginePersistencePort } from './services/auth-engine-persistence.port';
import { AuthOrchestrationService } from './services/auth-orchestration.service';
import { AuthPersistenceModule } from '../infrastructure-persistence';
import { AuthService } from './services/auth.service';
import { JwtAuthService } from './services/jwt-auth.service';
import { BetterAuthIsolatedPersistenceAdapter } from '../infrastructure-engine/better-auth/better-auth-isolated-persistence.adapter';
import { BetterAuthTypeormAdapterPersistenceAdapter } from '../infrastructure-engine/better-auth/better-auth-typeorm-adapter-persistence.adapter';

const ORIGINAL_AUTH_PERSISTENCE = process.env['AUTH_PERSISTENCE'];
const ORIGINAL_AUTH_STRATEGIES = process.env['AUTH_STRATEGIES'];
const ORIGINAL_AUTH_ENGINE = process.env['AUTH_ENGINE'];
const ORIGINAL_AUTH_ENGINE_PERSISTENCE_MODE =
  process.env['AUTH_ENGINE_PERSISTENCE_MODE'];
const ORIGINAL_AUTH_ENGINE_ISOLATED_TOPOLOGY =
  process.env['AUTH_ENGINE_ISOLATED_TOPOLOGY'];
const ORIGINAL_AUTH_ENGINE_SEPARATE_DB_HOST =
  process.env['AUTH_ENGINE_SEPARATE_DB_HOST'];
const ORIGINAL_AUTH_ENGINE_SEPARATE_DB_PORT =
  process.env['AUTH_ENGINE_SEPARATE_DB_PORT'];
const ORIGINAL_AUTH_ENGINE_SEPARATE_DB_USERNAME =
  process.env['AUTH_ENGINE_SEPARATE_DB_USERNAME'];
const ORIGINAL_AUTH_ENGINE_SEPARATE_DB_PASSWORD =
  process.env['AUTH_ENGINE_SEPARATE_DB_PASSWORD'];
const ORIGINAL_AUTH_ENGINE_SEPARATE_DB_DATABASE =
  process.env['AUTH_ENGINE_SEPARATE_DB_DATABASE'];
const ORIGINAL_AUTH_ENGINE_SEPARATE_DB_SSL =
  process.env['AUTH_ENGINE_SEPARATE_DB_SSL'];

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

    if (ORIGINAL_AUTH_ENGINE === undefined) {
      delete process.env['AUTH_ENGINE'];
    } else {
      process.env['AUTH_ENGINE'] = ORIGINAL_AUTH_ENGINE;
    }

    if (ORIGINAL_AUTH_ENGINE_PERSISTENCE_MODE === undefined) {
      delete process.env['AUTH_ENGINE_PERSISTENCE_MODE'];
    } else {
      process.env['AUTH_ENGINE_PERSISTENCE_MODE'] =
        ORIGINAL_AUTH_ENGINE_PERSISTENCE_MODE;
    }

    if (ORIGINAL_AUTH_ENGINE_ISOLATED_TOPOLOGY === undefined) {
      delete process.env['AUTH_ENGINE_ISOLATED_TOPOLOGY'];
    } else {
      process.env['AUTH_ENGINE_ISOLATED_TOPOLOGY'] =
        ORIGINAL_AUTH_ENGINE_ISOLATED_TOPOLOGY;
    }

    if (ORIGINAL_AUTH_ENGINE_SEPARATE_DB_HOST === undefined) {
      delete process.env['AUTH_ENGINE_SEPARATE_DB_HOST'];
    } else {
      process.env['AUTH_ENGINE_SEPARATE_DB_HOST'] =
        ORIGINAL_AUTH_ENGINE_SEPARATE_DB_HOST;
    }

    if (ORIGINAL_AUTH_ENGINE_SEPARATE_DB_PORT === undefined) {
      delete process.env['AUTH_ENGINE_SEPARATE_DB_PORT'];
    } else {
      process.env['AUTH_ENGINE_SEPARATE_DB_PORT'] =
        ORIGINAL_AUTH_ENGINE_SEPARATE_DB_PORT;
    }

    if (ORIGINAL_AUTH_ENGINE_SEPARATE_DB_USERNAME === undefined) {
      delete process.env['AUTH_ENGINE_SEPARATE_DB_USERNAME'];
    } else {
      process.env['AUTH_ENGINE_SEPARATE_DB_USERNAME'] =
        ORIGINAL_AUTH_ENGINE_SEPARATE_DB_USERNAME;
    }

    if (ORIGINAL_AUTH_ENGINE_SEPARATE_DB_PASSWORD === undefined) {
      delete process.env['AUTH_ENGINE_SEPARATE_DB_PASSWORD'];
    } else {
      process.env['AUTH_ENGINE_SEPARATE_DB_PASSWORD'] =
        ORIGINAL_AUTH_ENGINE_SEPARATE_DB_PASSWORD;
    }

    if (ORIGINAL_AUTH_ENGINE_SEPARATE_DB_DATABASE === undefined) {
      delete process.env['AUTH_ENGINE_SEPARATE_DB_DATABASE'];
    } else {
      process.env['AUTH_ENGINE_SEPARATE_DB_DATABASE'] =
        ORIGINAL_AUTH_ENGINE_SEPARATE_DB_DATABASE;
    }

    if (ORIGINAL_AUTH_ENGINE_SEPARATE_DB_SSL === undefined) {
      delete process.env['AUTH_ENGINE_SEPARATE_DB_SSL'];
    } else {
      process.env['AUTH_ENGINE_SEPARATE_DB_SSL'] =
        ORIGINAL_AUTH_ENGINE_SEPARATE_DB_SSL;
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

  it('should accept neutral engine persistence env settings without changing composition', () => {
    process.env['AUTH_ENGINE'] = 'better-auth';
    process.env['AUTH_ENGINE_PERSISTENCE_MODE'] = 'typeorm-adapter';
    process.env['AUTH_ENGINE_ISOLATED_TOPOLOGY'] = 'separate-db';
    process.env['AUTH_ENGINE_SEPARATE_DB_HOST'] = 'db.example.test';
    process.env['AUTH_ENGINE_SEPARATE_DB_USERNAME'] = 'auth_user';
    process.env['AUTH_ENGINE_SEPARATE_DB_PASSWORD'] = 'auth_pass';
    process.env['AUTH_ENGINE_SEPARATE_DB_DATABASE'] = 'auth_db';

    const moduleMetadata = AuthApplicationModule.forRootFromConfig({
      authStrategies: ['jwt'],
      persistence: { persistence: 'typeorm' },
    });

    expect(moduleMetadata.module).toBe(AuthApplicationModule);
    expect(moduleMetadata.exports).toContain(AuthService);
  });

  it('should select the isolated Better Auth persistence provider when configured', () => {
    const moduleMetadata = AuthApplicationModule.forRoot({
      engine: 'better-auth',
      engineOptions: {
        persistence: {
          mode: 'isolated',
          isolatedTopology: 'same-db',
        },
      },
      authStrategies: ['jwt'],
      spike: {
        proofHarnessEnabled: true,
      },
    });

    expect(moduleMetadata.providers).toEqual(
      expect.arrayContaining([
        BetterAuthIsolatedPersistenceAdapter,
        expect.objectContaining({
          provide: AuthEnginePersistencePort,
          useExisting: BetterAuthIsolatedPersistenceAdapter,
        }),
      ]),
    );
  });

  it('should select the TypeORM-adapter Better Auth persistence provider when configured', () => {
    const moduleMetadata = AuthApplicationModule.forRoot({
      engine: 'better-auth',
      engineOptions: {
        persistence: {
          mode: 'typeorm-adapter',
          isolatedTopology: 'separate-db',
        },
      },
      authStrategies: ['jwt'],
      spike: {
        proofHarnessEnabled: true,
      },
    });

    expect(moduleMetadata.providers).toEqual(
      expect.arrayContaining([
        BetterAuthTypeormAdapterPersistenceAdapter,
        expect.objectContaining({
          provide: AuthEnginePersistencePort,
          useExisting: BetterAuthTypeormAdapterPersistenceAdapter,
        }),
      ]),
    );
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
    expect(moduleMetadata.providers).not.toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          provide: AuthEnginePersistencePort,
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
