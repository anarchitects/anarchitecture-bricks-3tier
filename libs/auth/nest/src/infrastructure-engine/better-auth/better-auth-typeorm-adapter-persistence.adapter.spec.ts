import type { BetterAuthOptions } from 'better-auth';
import type { DataSource } from 'typeorm';
import type { ResolvedAuthApplicationModuleOptions } from '../../config';
import { AccountEntity } from '../../infrastructure-persistence/entities/account.entity';
import { SessionEntity } from '../../infrastructure-persistence/entities/session.entity';
import { UserEntity } from '../../infrastructure-persistence/entities/user.entity';
import { VerificationEntity } from '../../infrastructure-persistence/entities/verification.entity';
import { loadBetterAuthTypeormAdapterModule } from './better-auth.module-loader';
import {
  BetterAuthTypeormDatabaseAdapter,
  createBetterAuthTypeormModels,
} from './better-auth-typeorm-adapter-persistence.adapter';
import { PasskeyEntity } from './plugins/passkeys/passkey.entity';

jest.mock('./better-auth.module-loader', () => ({
  loadBetterAuthTypeormAdapterModule: jest.fn(),
}));

const baseOptions = {
  betterAuth: {
    baseUrl: 'http://localhost:3000/api/auth',
    secret: 'better-auth-secret-32-chars-minimum',
    callbackUrls: {
      verifyEmail: 'http://localhost:3000/verify-email',
      resetPassword: 'http://localhost:3000/reset-password',
    },
  },
  plugins: {
    jwt: {
      enabled: false,
      secret: 'default_jwt_secret',
      expiration: '3600s',
      audience: 'your_audience',
      issuer: 'your_issuer',
    },
    passkeys: {
      enabled: false,
      rpID: 'localhost',
      rpName: 'Anarchitecture Auth',
      origin: undefined,
    },
    social: {
      enabled: false,
      github: undefined,
    },
    oidc: {
      enabled: false,
    },
  },
  encryption: {
    algorithm: 'bcrypt',
    key: 'default_encryption_key',
  },
  resourceAuthorization: {
    loaders: {},
  },
} satisfies ResolvedAuthApplicationModuleOptions;

describe('BetterAuthTypeormDatabaseAdapter', () => {
  const createBetterAuthTypeormAdapter = jest.fn<
    BetterAuthOptions['database'],
    [Record<string, unknown>]
  >();

  beforeEach(() => {
    jest.clearAllMocks();
    createBetterAuthTypeormAdapter.mockReturnValue({
      kind: 'database',
    } as never);
    (loadBetterAuthTypeormAdapterModule as jest.Mock).mockResolvedValue({
      createBetterAuthTypeormAdapter,
    });
  });

  it('throws when no TypeORM DataSource is available', async () => {
    const adapter = new BetterAuthTypeormDatabaseAdapter(baseOptions);

    await expect(adapter.resolveDatabase()).rejects.toThrow(
      'Better Auth TypeORM adapter persistence requires an active TypeORM DataSource.',
    );
    expect(loadBetterAuthTypeormAdapterModule).not.toHaveBeenCalled();
  });

  it('creates the external adapter with the expected core model map', async () => {
    const dataSource = { name: 'test-data-source' } as DataSource;
    const adapter = new BetterAuthTypeormDatabaseAdapter(
      baseOptions,
      dataSource,
    );

    await expect(adapter.resolveDatabase()).resolves.toEqual({
      kind: 'database',
    });

    expect(loadBetterAuthTypeormAdapterModule).toHaveBeenCalledTimes(1);
    expect(createBetterAuthTypeormAdapter).toHaveBeenCalledWith({
      dataSource,
      models: {
        users: UserEntity,
        accounts: AccountEntity,
        sessions: SessionEntity,
        verifications: VerificationEntity,
      },
      adapterId: 'anarchitects-typeorm',
      adapterName: 'Anarchitects TypeORM Adapter',
    });
  });

  it('adds the passkeys model when the passkeys plugin is enabled', async () => {
    const dataSource = { name: 'test-data-source' } as DataSource;
    const adapter = new BetterAuthTypeormDatabaseAdapter(
      {
        ...baseOptions,
        plugins: {
          ...baseOptions.plugins,
          passkeys: {
            ...baseOptions.plugins.passkeys,
            enabled: true,
          },
        },
      },
      dataSource,
    );

    await adapter.resolveDatabase();

    expect(createBetterAuthTypeormAdapter).toHaveBeenCalledWith(
      expect.objectContaining({
        models: {
          users: UserEntity,
          accounts: AccountEntity,
          sessions: SessionEntity,
          verifications: VerificationEntity,
          passkeys: PasskeyEntity,
        },
      }),
    );
  });
});

describe('createBetterAuthTypeormModels', () => {
  it('returns the core Better Auth model map by default', () => {
    expect(createBetterAuthTypeormModels(baseOptions)).toEqual({
      users: UserEntity,
      accounts: AccountEntity,
      sessions: SessionEntity,
      verifications: VerificationEntity,
    });
  });

  it('adds passkeys when the plugin is enabled', () => {
    expect(
      createBetterAuthTypeormModels({
        plugins: {
          ...baseOptions.plugins,
          passkeys: {
            ...baseOptions.plugins.passkeys,
            enabled: true,
          },
        },
      }),
    ).toEqual({
      users: UserEntity,
      accounts: AccountEntity,
      sessions: SessionEntity,
      verifications: VerificationEntity,
      passkeys: PasskeyEntity,
    });
  });
});
