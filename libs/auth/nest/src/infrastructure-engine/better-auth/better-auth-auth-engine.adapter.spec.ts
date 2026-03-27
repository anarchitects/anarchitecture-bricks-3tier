import { AuthEnginePersistencePort } from '../../application/services/auth-engine-persistence.port';
import type { ResolvedAuthApplicationModuleOptions } from '../../config';
import { BetterAuthAuthEngineAdapter } from './better-auth-auth-engine.adapter';
import { loadBetterAuthRuntimeModules } from './better-auth.module-loader';

jest.mock('./better-auth.module-loader', () => ({
  loadBetterAuthRuntimeModules: jest.fn(),
}));

describe('BetterAuthAuthEngineAdapter', () => {
  const signInEmail = jest.fn();
  const betterAuthFactory = jest.fn();
  const passkey = jest.fn();

  const options = {
    authStrategies: ['jwt'],
    engine: 'better-auth',
    sessionMode: 'session',
    engineOptions: {
      persistence: {
        mode: 'isolated',
        isolatedTopology: 'same-db',
      },
    },
    features: {
      passkeys: false,
      social: false,
      oidc: false,
    },
    spike: {
      baseUrl: 'http://localhost:3000/api/auth',
      secret: 'better-auth-spike-secret-32-chars-minimum',
      proofHarnessEnabled: true,
      socialProviders: {
        github: undefined,
      },
      passkeys: {
        rpID: 'localhost',
        rpName: 'Anarchitecture Auth Spike',
        origin: undefined,
      },
    },
    encryption: {
      algorithm: 'bcrypt',
      key: 'default_encryption_key',
    },
    persistence: {
      persistence: 'typeorm',
    },
    resourceAuthorization: {
      loaders: {},
    },
  } satisfies ResolvedAuthApplicationModuleOptions;

  const persistencePort = {
    resolveDatabase: jest.fn(),
  } satisfies Pick<AuthEnginePersistencePort, 'resolveDatabase'>;

  beforeEach(() => {
    jest.clearAllMocks();

    signInEmail.mockResolvedValue({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });
    betterAuthFactory.mockReturnValue({
      api: {
        signInEmail,
      },
      handler: jest.fn(),
    });
    (loadBetterAuthRuntimeModules as jest.Mock).mockResolvedValue({
      betterAuth: {
        betterAuth: betterAuthFactory,
      },
      betterAuthPasskey: {
        passkey,
      },
    });
  });

  it('resolves Better Auth persistence through the application-layer port', async () => {
    const database = { kind: 'database' };
    persistencePort.resolveDatabase.mockResolvedValue(database);

    const adapter = new BetterAuthAuthEngineAdapter(
      options,
      persistencePort as AuthEnginePersistencePort,
    );

    await expect(
      adapter.passwordSignIn({
        credential: 'user@example.com',
        password: 'password',
      }),
    ).resolves.toEqual({
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    });

    expect(persistencePort.resolveDatabase).toHaveBeenCalled();
    expect(betterAuthFactory).toHaveBeenCalledWith(
      expect.objectContaining({
        database,
      }),
    );
  });

  it('surfaces placeholder persistence selection errors during runtime init', async () => {
    persistencePort.resolveDatabase.mockRejectedValue(
      new Error(
        'Better Auth isolated persistence for topology "same-db" is not implemented yet. See issue #167.',
      ),
    );

    const adapter = new BetterAuthAuthEngineAdapter(
      options,
      persistencePort as AuthEnginePersistencePort,
    );

    await expect(
      adapter.passwordSignIn({
        credential: 'user@example.com',
        password: 'password',
      }),
    ).rejects.toThrow(
      'Better Auth isolated persistence for topology "same-db" is not implemented yet. See issue #167.',
    );
    expect(betterAuthFactory).not.toHaveBeenCalled();
  });
});
