import {
  mapAuthConfigToApplicationModuleOptions,
  mapAuthConfigToAuthModuleOptions,
  mapAuthConfigToMailerModuleOptions,
  mapAuthConfigToPersistenceModuleOptions,
  mapAuthConfigToPresentationModuleOptions,
  resolveAuthApplicationModuleOptions,
  resolveAuthModuleOptions,
} from './module-options';
import type { AuthConfig } from './auth.config';

describe('auth module option mappers', () => {
  const config: AuthConfig = {
    jwtSecret: 'secret',
    jwtExpiration: '3600s',
    jwtAudience: 'aud',
    jwtIssuer: 'issuer',
    encryptionAlgorithm: 'bcrypt',
    encryptionKey: 'key',
    persistence: 'typeorm',
    mailerProvider: 'noop',
    authStrategies: ['jwt'],
    engine: 'better-auth',
    sessionMode: 'session',
    engineOptions: {
      persistence: {
        mode: 'typeorm-adapter',
        isolatedTopology: 'separate-db',
        separateDatabase: {
          host: 'db.example.test',
          port: 6543,
          username: 'auth_user',
          password: 'auth_pass',
          database: 'auth_db',
          ssl: true,
        },
      },
    },
    features: {
      passkeys: true,
      social: true,
      oidc: false,
    },
    spike: {
      baseUrl: 'http://localhost:3100/api/auth',
      secret: '0123456789abcdef0123456789abcdef',
      proofHarnessEnabled: true,
      socialProviders: {
        github: {
          clientId: 'github-client',
          clientSecret: 'github-secret',
        },
      },
      passkeys: {
        rpID: 'example.test',
        rpName: 'Example Test',
        origin: 'https://example.test',
      },
    },
  };

  it('maps persistence options from auth config', () => {
    expect(mapAuthConfigToPersistenceModuleOptions(config)).toEqual({
      persistence: 'typeorm',
    });
  });

  it('maps mailer options from auth config', () => {
    expect(mapAuthConfigToMailerModuleOptions(config)).toEqual({
      provider: 'noop',
    });
  });

  it('maps application options from auth config', () => {
    expect(mapAuthConfigToApplicationModuleOptions(config)).toEqual({
      authStrategies: ['jwt'],
      engine: 'better-auth',
      sessionMode: 'session',
      engineOptions: {
        persistence: {
          mode: 'typeorm-adapter',
          isolatedTopology: 'separate-db',
          separateDatabase: {
            host: 'db.example.test',
            port: 6543,
            username: 'auth_user',
            password: 'auth_pass',
            database: 'auth_db',
            ssl: true,
          },
        },
      },
      features: {
        passkeys: true,
        social: true,
        oidc: false,
      },
      spike: {
        baseUrl: 'http://localhost:3100/api/auth',
        secret: '0123456789abcdef0123456789abcdef',
        proofHarnessEnabled: true,
        socialProviders: {
          github: {
            clientId: 'github-client',
            clientSecret: 'github-secret',
          },
        },
        passkeys: {
          rpID: 'example.test',
          rpName: 'Example Test',
          origin: 'https://example.test',
        },
      },
      encryption: {
        algorithm: 'bcrypt',
        key: 'key',
      },
      persistence: { persistence: 'typeorm' },
    });
  });

  it('maps presentation options from auth config', () => {
    expect(mapAuthConfigToPresentationModuleOptions(config)).toEqual({
      application: {
        authStrategies: ['jwt'],
        engine: 'better-auth',
        sessionMode: 'session',
        engineOptions: {
          persistence: {
            mode: 'typeorm-adapter',
            isolatedTopology: 'separate-db',
            separateDatabase: {
              host: 'db.example.test',
              port: 6543,
              username: 'auth_user',
              password: 'auth_pass',
              database: 'auth_db',
              ssl: true,
            },
          },
        },
        features: {
          passkeys: true,
          social: true,
          oidc: false,
        },
        spike: {
          baseUrl: 'http://localhost:3100/api/auth',
          secret: '0123456789abcdef0123456789abcdef',
          proofHarnessEnabled: true,
          socialProviders: {
            github: {
              clientId: 'github-client',
              clientSecret: 'github-secret',
            },
          },
          passkeys: {
            rpID: 'example.test',
            rpName: 'Example Test',
            origin: 'https://example.test',
          },
        },
        encryption: {
          algorithm: 'bcrypt',
          key: 'key',
        },
        persistence: { persistence: 'typeorm' },
      },
    });
  });

  it('maps root options from auth config', () => {
    expect(mapAuthConfigToAuthModuleOptions(config)).toEqual({
      presentation: {
        application: {
          authStrategies: ['jwt'],
          engine: 'better-auth',
          sessionMode: 'session',
          engineOptions: {
            persistence: {
              mode: 'typeorm-adapter',
              isolatedTopology: 'separate-db',
              separateDatabase: {
                host: 'db.example.test',
                port: 6543,
                username: 'auth_user',
                password: 'auth_pass',
                database: 'auth_db',
                ssl: true,
              },
            },
          },
          features: {
            passkeys: true,
            social: true,
            oidc: false,
          },
          spike: {
            baseUrl: 'http://localhost:3100/api/auth',
            secret: '0123456789abcdef0123456789abcdef',
            proofHarnessEnabled: true,
            socialProviders: {
              github: {
                clientId: 'github-client',
                clientSecret: 'github-secret',
              },
            },
            passkeys: {
              rpID: 'example.test',
              rpName: 'Example Test',
              origin: 'https://example.test',
            },
          },
          encryption: {
            algorithm: 'bcrypt',
            key: 'key',
          },
          persistence: { persistence: 'typeorm' },
        },
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
      authStrategies: ['jwt'],
      engine: 'legacy-jwt',
      sessionMode: 'jwt',
      engineOptions: {
        persistence: {
          mode: 'isolated',
          isolatedTopology: 'same-db',
          separateDatabase: {
            host: undefined,
            port: 5432,
            username: undefined,
            password: undefined,
            database: undefined,
            ssl: false,
          },
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
        proofHarnessEnabled: false,
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
      persistence: { persistence: 'typeorm' },
      resourceAuthorization: { loaders: {} },
    });
  });

  it('resolves default root options deterministically', () => {
    expect(resolveAuthModuleOptions({})).toEqual({
      presentation: {
        application: {
          authStrategies: ['jwt'],
          engine: 'legacy-jwt',
          sessionMode: 'jwt',
          engineOptions: {
            persistence: {
              mode: 'isolated',
              isolatedTopology: 'same-db',
              separateDatabase: {
                host: undefined,
                port: 5432,
                username: undefined,
                password: undefined,
                database: undefined,
                ssl: false,
              },
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
            proofHarnessEnabled: false,
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
          persistence: { persistence: 'typeorm' },
          resourceAuthorization: { loaders: {} },
        },
      },
      mailer: {
        provider: 'node',
      },
    });
  });

  it('resolves explicit resource authorization loaders deterministically', () => {
    const loaders = {
      Post: jest.fn(),
    };

    expect(
      resolveAuthApplicationModuleOptions({
        resourceAuthorization: { loaders },
      }),
    ).toEqual({
      authStrategies: ['jwt'],
      engine: 'legacy-jwt',
      sessionMode: 'jwt',
      engineOptions: {
        persistence: {
          mode: 'isolated',
          isolatedTopology: 'same-db',
          separateDatabase: {
            host: undefined,
            port: 5432,
            username: undefined,
            password: undefined,
            database: undefined,
            ssl: false,
          },
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
        proofHarnessEnabled: false,
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
      persistence: { persistence: 'typeorm' },
      resourceAuthorization: { loaders },
    });
  });

  it('lets explicit engine persistence overrides win over defaults', () => {
    expect(
      resolveAuthApplicationModuleOptions({
        engineOptions: {
          persistence: {
            mode: 'typeorm-adapter',
            isolatedTopology: 'separate-db',
            separateDatabase: {
              host: 'db.example.test',
              port: 6543,
              username: 'auth_user',
              password: 'auth_pass',
              database: 'auth_db',
              ssl: true,
            },
          },
        },
      }),
    ).toEqual(
      expect.objectContaining({
        engineOptions: {
          persistence: {
            mode: 'typeorm-adapter',
            isolatedTopology: 'separate-db',
            separateDatabase: {
              host: 'db.example.test',
              port: 6543,
              username: 'auth_user',
              password: 'auth_pass',
              database: 'auth_db',
              ssl: true,
            },
          },
        },
      }),
    );
  });

  it('requires separate database coordinates when isolated topology is separate-db', () => {
    expect(() =>
      resolveAuthApplicationModuleOptions({
        engineOptions: {
          persistence: {
            mode: 'isolated',
            isolatedTopology: 'separate-db',
          },
        },
      }),
    ).toThrow(
      'Auth engine separate database configuration is incomplete: missing host, username, password, database',
    );
  });
});
