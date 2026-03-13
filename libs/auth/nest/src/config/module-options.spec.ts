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
      encryption: {
        algorithm: 'bcrypt',
        key: 'default_encryption_key',
      },
      persistence: { persistence: 'typeorm' },
    });
  });

  it('resolves default root options deterministically', () => {
    expect(resolveAuthModuleOptions({})).toEqual({
      presentation: {
        application: {
          authStrategies: ['jwt'],
          encryption: {
            algorithm: 'bcrypt',
            key: 'default_encryption_key',
          },
          persistence: { persistence: 'typeorm' },
        },
      },
      mailer: {
        provider: 'node',
      },
    });
  });
});
