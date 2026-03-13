import {
  DEFAULT_MAILER_PROVIDER,
  InjectMailerConfig,
  MAILER_CONFIG_KEY,
  mailerConfig,
} from './mailer.config';

const MAILER_ENV_KEYS = [
  'MAILER_PROVIDER',
  'MAILER_HOST',
  'MAILER_PORT',
  'MAILER_SECURE',
  'MAILER_USER',
  'MAILER_PASS',
  'MAILER_DEFAULT',
  'MAILER_IGNORE_TLS',
  'MAILER_TEMPLATE_DIR',
] as const;

type MailerEnvKey = (typeof MAILER_ENV_KEYS)[number];

const originalEnv: Record<MailerEnvKey, string | undefined> =
  MAILER_ENV_KEYS.reduce(
    (acc, key) => {
      acc[key] = process.env[key];
      return acc;
    },
    {} as Record<MailerEnvKey, string | undefined>,
  );

describe('mailerConfig', () => {
  beforeEach(() => {
    MAILER_ENV_KEYS.forEach((key) => {
      delete process.env[key];
    });
  });

  afterEach(() => {
    MAILER_ENV_KEYS.forEach((key) => {
      const value = originalEnv[key];
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    });
  });

  it('returns default values when no environment variables are set', () => {
    const config = mailerConfig();

    expect(config).toEqual({
      provider: DEFAULT_MAILER_PROVIDER,
      host: 'smtp.example.com',
      port: 587,
      secure: false,
      user: 'user@example.com',
      pass: 'password',
      default: 'default@example.com',
      ignoreTLS: false,
      templateDir: 'templates',
    });
  });

  it('uses provided environment variables when available', () => {
    process.env['MAILER_PROVIDER'] = 'noop';
    process.env['MAILER_HOST'] = 'smtp.mailtrap.io';
    process.env['MAILER_PORT'] = '2525';
    process.env['MAILER_SECURE'] = 'true';
    process.env['MAILER_USER'] = 'mailer@domain.test';
    process.env['MAILER_PASS'] = 'super-secret';
    process.env['MAILER_DEFAULT'] = 'noreply@domain.test';
    process.env['MAILER_IGNORE_TLS'] = 'true';
    process.env['MAILER_TEMPLATE_DIR'] = 'custom-templates';

    const config = mailerConfig();

    expect(config).toEqual({
      provider: 'noop',
      host: 'smtp.mailtrap.io',
      port: 2525,
      secure: true,
      user: 'mailer@domain.test',
      pass: 'super-secret',
      default: 'noreply@domain.test',
      ignoreTLS: true,
      templateDir: 'custom-templates',
    });
  });

  it('throws when MAILER_PROVIDER is unsupported', () => {
    process.env['MAILER_PROVIDER'] = 'invalid';

    expect(() => mailerConfig()).toThrow(
      'Unsupported mailer provider: invalid',
    );
  });

  it('exposes the expected configuration key', () => {
    expect(mailerConfig.KEY).toContain(MAILER_CONFIG_KEY);
  });
});

describe('InjectMailerConfig', () => {
  it('returns an injectable decorator factory', () => {
    expect(typeof InjectMailerConfig()).toBe('function');
  });
});
