import { MailerPort } from '@anarchitects/common-nest-mailer';
import { BetterAuthDatabasePort } from '../../application/services/better-auth-database.port';
import { HashService } from '../../application/services/hash.service';
import type { ResolvedAuthApplicationModuleOptions } from '../../config';
import { BetterAuthAuthEngineAdapter } from './better-auth-auth-engine.adapter';
import { loadBetterAuthRuntimeModules } from './better-auth.module-loader';

jest.mock('./better-auth.module-loader', () => ({
  loadBetterAuthRuntimeModules: jest.fn(),
}));

describe('BetterAuthAuthEngineAdapter', () => {
  const signUpEmail = jest.fn();
  const signInEmail = jest.fn();
  const requestPasswordReset = jest.fn();
  const resetPassword = jest.fn();
  const signOut = jest.fn();
  const verifyEmail = jest.fn();
  const getSession = jest.fn();
  const signInPasskey = jest.fn();
  const signInSocial = jest.fn();
  const betterAuthFactory = jest.fn();

  const options = {
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

  const persistencePort = {
    resolveDatabase: jest.fn(),
  } satisfies Pick<BetterAuthDatabasePort, 'resolveDatabase'>;
  const hashService = {
    hash: jest.fn().mockResolvedValue('hashed-password'),
    compare: jest.fn().mockResolvedValue(true),
  } satisfies Pick<HashService, 'hash' | 'compare'>;
  const mailer = {
    send: jest.fn().mockResolvedValue(undefined),
    sendTemplate: jest.fn(),
  } satisfies Pick<MailerPort, 'send' | 'sendTemplate'>;

  beforeEach(() => {
    jest.clearAllMocks();

    signUpEmail.mockResolvedValue({
      headers: new Headers(),
      response: { user: { id: 'registered-user-id' } },
    });
    signInEmail.mockResolvedValue({
      headers: new Headers({ 'set-cookie': 'better-auth.session=abc' }),
      response: { user: { id: 'user-id' } },
    });
    requestPasswordReset.mockResolvedValue({});
    resetPassword.mockResolvedValue({ headers: new Headers() });
    signOut.mockResolvedValue({
      headers: new Headers({ 'set-cookie': 'better-auth.session=; Max-Age=0' }),
      response: {},
    });
    verifyEmail.mockResolvedValue({ headers: new Headers() });
    getSession.mockResolvedValue({
      headers: new Headers({ 'set-cookie': 'better-auth.session=abc' }),
      response: { user: { id: 'user-id' } },
    });
    signInPasskey.mockResolvedValue({
      headers: new Headers(),
      response: { user: { id: 'user-id' } },
    });
    signInSocial.mockResolvedValue({ url: 'https://example.test' });
    betterAuthFactory.mockReturnValue({
      api: {
        signUpEmail,
        signInEmail,
        requestPasswordReset,
        resetPassword,
        signOut,
        verifyEmail,
        getSession,
        signInPasskey,
        signInSocial,
      },
      handler: jest.fn(),
    });
    (loadBetterAuthRuntimeModules as jest.Mock).mockResolvedValue({
      betterAuth: {
        betterAuth: betterAuthFactory,
      },
      betterAuthAdapters: {},
      betterAuthPasskey: {},
      betterAuthMigration: {
        getMigrations: jest.fn(),
      },
    });
  });

  it('resolves Better Auth persistence through the application-layer port', async () => {
    const database = { kind: 'database' };
    persistencePort.resolveDatabase.mockResolvedValue(database);

    const adapter = new BetterAuthAuthEngineAdapter(
      options,
      persistencePort as BetterAuthDatabasePort,
      hashService as HashService,
      mailer as MailerPort,
    );

    await expect(
      adapter.passwordSignIn({
        credential: 'user@example.com',
        password: 'password',
      }),
    ).resolves.toEqual({
      userId: 'user-id',
      headers: expect.any(Headers),
    });

    expect(persistencePort.resolveDatabase).toHaveBeenCalled();
    expect(betterAuthFactory).toHaveBeenCalledWith(
      expect.objectContaining({
        database,
      }),
    );
  });

  it('returns session state from Better Auth getSession', async () => {
    persistencePort.resolveDatabase.mockResolvedValue({ kind: 'database' });
    const adapter = new BetterAuthAuthEngineAdapter(
      options,
      persistencePort as BetterAuthDatabasePort,
      hashService as HashService,
      mailer as MailerPort,
    );

    await expect(
      adapter.getSession(new Headers({ cookie: 'better-auth.session=abc' })),
    ).resolves.toEqual({
      userId: 'user-id',
      headers: expect.any(Headers),
    });
  });

  it('surfaces persistence resolution errors during runtime init', async () => {
    persistencePort.resolveDatabase.mockRejectedValue(
      new Error('Better Auth TypeORM adapter persistence is unavailable.'),
    );

    const adapter = new BetterAuthAuthEngineAdapter(
      options,
      persistencePort as BetterAuthDatabasePort,
      hashService as HashService,
      mailer as MailerPort,
    );

    await expect(
      adapter.passwordSignIn({
        credential: 'user@example.com',
        password: 'password',
      }),
    ).rejects.toThrow('Better Auth TypeORM adapter persistence is unavailable.');
    expect(betterAuthFactory).not.toHaveBeenCalled();
  });

  it('reports capabilities from the plugin configuration', async () => {
    persistencePort.resolveDatabase.mockResolvedValue({ kind: 'database' });
    const adapter = new BetterAuthAuthEngineAdapter(
      {
        ...options,
        plugins: {
          ...options.plugins,
          passkeys: {
            ...options.plugins.passkeys,
            enabled: true,
          },
          social: {
            enabled: true,
            github: {
              clientId: 'github-client',
              clientSecret: 'github-secret',
            },
          },
        },
      },
      persistencePort as BetterAuthDatabasePort,
      hashService as HashService,
      mailer as MailerPort,
    );

    await expect(adapter.describeCapabilities()).resolves.toEqual({
      engine: 'better-auth',
      flows: expect.arrayContaining([
        expect.objectContaining({
          flow: 'password-sign-in',
          status: 'supported',
        }),
        expect.objectContaining({
          flow: 'passkey-sign-in',
          status: 'supported',
        }),
        expect.objectContaining({
          flow: 'social-sign-in',
          status: 'supported',
        }),
      ]),
    });
  });

  it('delegates registration to Better Auth sign-up with the package callback URL', async () => {
    persistencePort.resolveDatabase.mockResolvedValue({ kind: 'database' });
    const adapter = new BetterAuthAuthEngineAdapter(
      options,
      persistencePort as BetterAuthDatabasePort,
      hashService as HashService,
      mailer as MailerPort,
    );

    await expect(
      adapter.register({
        email: 'user@example.com',
        password: 'password123',
        confirmPassword: 'password123',
        name: 'User Name',
      }),
    ).resolves.toEqual({
      success: true,
      headers: expect.any(Headers),
      userId: 'registered-user-id',
    });

    expect(signUpEmail).toHaveBeenCalledWith(
      expect.objectContaining({
        body: expect.objectContaining({
          callbackURL: 'http://localhost:3000/verify-email',
        }),
      }),
    );
  });

  it('delegates password-reset requests to Better Auth with the package callback URL', async () => {
    persistencePort.resolveDatabase.mockResolvedValue({ kind: 'database' });
    const adapter = new BetterAuthAuthEngineAdapter(
      options,
      persistencePort as BetterAuthDatabasePort,
      hashService as HashService,
      mailer as MailerPort,
    );

    await expect(
      adapter.requestPasswordReset({ email: 'user@example.com' }),
    ).resolves.toEqual({ success: true });

    expect(requestPasswordReset).toHaveBeenCalledWith({
      body: {
        email: 'user@example.com',
        redirectTo: 'http://localhost:3000/reset-password',
      },
    });
  });

  it('delegates token verification and reset-password flows to Better Auth', async () => {
    persistencePort.resolveDatabase.mockResolvedValue({ kind: 'database' });
    const adapter = new BetterAuthAuthEngineAdapter(
      options,
      persistencePort as BetterAuthDatabasePort,
      hashService as HashService,
      mailer as MailerPort,
    );

    await expect(
      adapter.resetPassword({
        token: 'reset-token',
        password: 'newPassword123',
        confirmPassword: 'newPassword123',
      }),
    ).resolves.toEqual({
      success: true,
      headers: expect.any(Headers),
    });
    await expect(adapter.verifyEmail('verify-token')).resolves.toEqual({
      success: true,
      headers: expect.any(Headers),
    });

    expect(resetPassword).toHaveBeenCalledWith(
      expect.objectContaining({
        body: {
          token: 'reset-token',
          newPassword: 'newPassword123',
        },
      }),
    );
    expect(verifyEmail).toHaveBeenCalledWith({
      query: { token: 'verify-token' },
      headers: expect.any(Headers),
      returnHeaders: true,
    });
  });

  it('wires Better Auth password hashing and mailer callbacks to package services', async () => {
    persistencePort.resolveDatabase.mockResolvedValue({ kind: 'database' });
    const adapter = new BetterAuthAuthEngineAdapter(
      options,
      persistencePort as BetterAuthDatabasePort,
      hashService as HashService,
      mailer as MailerPort,
    );

    await adapter.passwordSignIn({
      credential: 'user@example.com',
      password: 'password',
    });

    const authOptions = betterAuthFactory.mock.calls[0][0];
    await authOptions.emailAndPassword.password.hash('plain-password');
    await authOptions.emailAndPassword.password.verify({
      hash: 'stored-hash',
      password: 'plain-password',
    });
    await authOptions.emailVerification.sendVerificationEmail({
      user: { email: 'user@example.com' },
      url: 'http://localhost:3000/verify-email?token=abc',
      token: 'abc',
    });
    await authOptions.emailAndPassword.sendResetPassword({
      user: { email: 'user@example.com' },
      url: 'http://localhost:3000/reset-password?token=xyz',
      token: 'xyz',
    });

    expect(hashService.hash).toHaveBeenCalledWith('plain-password');
    expect(hashService.compare).toHaveBeenCalledWith(
      'plain-password',
      'stored-hash',
    );
    expect(mailer.send).toHaveBeenCalledTimes(2);
  });
});
