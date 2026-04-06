import { DefaultAuthContractConfig } from '@anarchitects/auth-ts';
import {
  mapAuthConfigToApplicationModuleOptions,
  mapAuthConfigToAuthModuleOptions,
  mapAuthConfigToMailerModuleOptions,
  mapAuthConfigToPersistenceModuleOptions,
  mapAuthConfigToPresentationModuleOptions,
  resolveAuthApplicationModuleOptions,
  resolveAuthContractConfig,
  resolveAuthModuleOptions,
} from './module-options';
import type { AuthConfig } from './auth.config';

describe('auth module option mappers', () => {
  const config: AuthConfig = {
    encryptionAlgorithm: 'bcrypt',
    encryptionKey: 'key',
    mailerProvider: 'noop',
    betterAuth: {
      baseUrl: 'http://localhost:3100/api/auth',
      secret: '0123456789abcdef0123456789abcdef',
      callbackUrls: {
        verifyEmail: 'http://localhost:3100/verify-email',
        resetPassword: 'http://localhost:3100/reset-password',
      },
    },
    plugins: {
      jwt: {
        enabled: true,
        secret: 'jwt-secret',
        expiration: '900s',
        audience: 'aud',
        issuer: 'issuer',
      },
      passkeys: {
        enabled: true,
        rpID: 'example.test',
        rpName: 'Example Test',
        origin: 'https://example.test',
      },
      social: {
        enabled: true,
        github: {
          clientId: 'github-client',
          clientSecret: 'github-secret',
        },
      },
      oidc: {
        enabled: true,
      },
    },
  };

  it('maps persistence options from auth config', () => {
    expect(mapAuthConfigToPersistenceModuleOptions(config)).toEqual({});
  });

  it('maps mailer options from auth config', () => {
    expect(mapAuthConfigToMailerModuleOptions(config)).toEqual({
      provider: 'noop',
    });
  });

  it('maps application options from auth config', () => {
    expect(mapAuthConfigToApplicationModuleOptions(config)).toEqual({
      betterAuth: {
        baseUrl: 'http://localhost:3100/api/auth',
        secret: '0123456789abcdef0123456789abcdef',
        callbackUrls: {
          verifyEmail: 'http://localhost:3100/verify-email',
          resetPassword: 'http://localhost:3100/reset-password',
        },
      },
      plugins: {
        jwt: {
          enabled: true,
          secret: 'jwt-secret',
          expiration: '900s',
          audience: 'aud',
          issuer: 'issuer',
        },
        passkeys: {
          enabled: true,
          rpID: 'example.test',
          rpName: 'Example Test',
          origin: 'https://example.test',
        },
        social: {
          enabled: true,
          github: {
            clientId: 'github-client',
            clientSecret: 'github-secret',
          },
        },
        oidc: {
          enabled: true,
        },
      },
      encryption: {
        algorithm: 'bcrypt',
        key: 'key',
      },
    });
  });

  it('maps presentation and root options from auth config', () => {
    expect(mapAuthConfigToPresentationModuleOptions(config)).toEqual({
      application: mapAuthConfigToApplicationModuleOptions(config),
    });

    expect(mapAuthConfigToAuthModuleOptions(config)).toEqual({
      presentation: {
        application: mapAuthConfigToApplicationModuleOptions(config),
      },
      mailer: {
        provider: 'noop',
      },
    });
  });
});

describe('auth module option resolvers', () => {
  it('resolves default application options deterministically', () => {
    expect(resolveAuthApplicationModuleOptions({})).toEqual({
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
    });
  });

  it('keeps Better Auth as the only built-in engine story and does not expose persistence mode selection', () => {
    const resolved = resolveAuthApplicationModuleOptions({}) as Record<
      string,
      unknown
    >;

    expect(resolved).not.toHaveProperty('engine');
    expect(resolved).not.toHaveProperty('persistence');
    expect(resolved).toHaveProperty('betterAuth');
    expect(resolved).toHaveProperty('plugins');
  });

  it('resolves default root options deterministically', () => {
    expect(resolveAuthModuleOptions({})).toEqual({
      presentation: {
        application: resolveAuthApplicationModuleOptions({}),
        contracts: DefaultAuthContractConfig,
      },
      mailer: {
        provider: 'node',
      },
    });
  });

  it('preserves the default auth contract profile when no overrides are supplied', () => {
    expect(resolveAuthContractConfig()).toEqual(DefaultAuthContractConfig);
  });

  it('merges nested contract overrides without clobbering sibling fields', () => {
    expect(
      resolveAuthContractConfig({
        register: {
          name: {
            required: true,
          },
        },
        login: {
          password: {
            minLength: 10,
          },
        },
      }),
    ).toEqual({
      ...DefaultAuthContractConfig,
      register: {
        ...DefaultAuthContractConfig.register,
        name: {
          ...DefaultAuthContractConfig.register.name,
          required: true,
        },
      },
      login: {
        ...DefaultAuthContractConfig.login,
        password: {
          ...DefaultAuthContractConfig.login.password,
          minLength: 10,
        },
      },
    });
  });

  it('lets explicit root contract overrides win deterministically', () => {
    expect(
      resolveAuthModuleOptions({
        contracts: {
          register: {
            name: {
              required: true,
            },
          },
        },
      }).presentation.contracts.register.name.required,
    ).toBe(true);
  });

  it('lets explicit plugin and Better Auth overrides win over defaults', () => {
    expect(
      resolveAuthApplicationModuleOptions({
        betterAuth: {
          baseUrl: 'http://localhost:3100/api/auth',
          callbackUrls: {
            verifyEmail: 'https://app.example.test/verify-email',
          },
        },
        plugins: {
          jwt: {
            enabled: true,
            secret: 'jwt-secret',
          },
          passkeys: {
            enabled: true,
            rpID: 'example.test',
          },
        },
      }),
    ).toEqual(
      expect.objectContaining({
        betterAuth: {
          baseUrl: 'http://localhost:3100/api/auth',
          secret: 'better-auth-secret-32-chars-minimum',
          callbackUrls: {
            verifyEmail: 'https://app.example.test/verify-email',
            resetPassword: 'http://localhost:3000/reset-password',
          },
        },
        plugins: expect.objectContaining({
          jwt: expect.objectContaining({
            enabled: true,
            secret: 'jwt-secret',
          }),
          passkeys: expect.objectContaining({
            enabled: true,
            rpID: 'example.test',
          }),
        }),
      }),
    );
  });

  it('resolves explicit resource authorization loaders deterministically', () => {
    const loaders = {
      Post: jest.fn(),
    };

    expect(
      resolveAuthApplicationModuleOptions({
        resourceAuthorization: { loaders },
      }),
    ).toEqual(
      expect.objectContaining({
        resourceAuthorization: { loaders },
      }),
    );
  });

  it('throws when social auth is enabled without required GitHub credentials', () => {
    expect(() =>
      resolveAuthApplicationModuleOptions({
        plugins: {
          social: {
            enabled: true,
          },
        },
      }),
    ).toThrow(
      'Social auth requires AUTH_PLUGIN_SOCIAL_GITHUB_CLIENT_ID and AUTH_PLUGIN_SOCIAL_GITHUB_CLIENT_SECRET when enabled.',
    );
  });
});
