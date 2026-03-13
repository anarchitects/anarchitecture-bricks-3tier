import { InjectFormsConfig, formsConfig } from './forms.config';

const FORMS_ENV_KEYS = ['FORMS_PERSISTENCE', 'FORMS_MAILER_PROVIDER'] as const;
type FormsEnvKey = (typeof FORMS_ENV_KEYS)[number];

const originalEnv: Record<FormsEnvKey, string | undefined> =
  FORMS_ENV_KEYS.reduce(
    (acc, key) => {
      acc[key] = process.env[key];
      return acc;
    },
    {} as Record<FormsEnvKey, string | undefined>,
  );

describe('formsConfig', () => {
  beforeEach(() => {
    FORMS_ENV_KEYS.forEach((key) => {
      delete process.env[key];
    });
  });

  afterEach(() => {
    FORMS_ENV_KEYS.forEach((key) => {
      const value = originalEnv[key];
      if (value === undefined) {
        delete process.env[key];
      } else {
        process.env[key] = value;
      }
    });
  });

  it('returns default values when no environment variables are set', () => {
    const config = formsConfig();

    expect(config).toEqual({
      persistence: 'typeorm',
      mailerProvider: 'node',
    });
  });

  it('uses provided environment variables when available', () => {
    process.env['FORMS_PERSISTENCE'] = 'custom-store';
    process.env['FORMS_MAILER_PROVIDER'] = 'noop';

    const config = formsConfig();

    expect(config).toEqual({
      persistence: 'custom-store',
      mailerProvider: 'noop',
    });
  });

  it('throws when FORMS_MAILER_PROVIDER is unsupported', () => {
    process.env['FORMS_MAILER_PROVIDER'] = 'invalid';

    expect(() => formsConfig()).toThrow('Unsupported mailer provider: invalid');
  });

  it('exposes the expected configuration key', () => {
    expect(formsConfig.KEY).toContain('forms');
  });
});

describe('InjectFormsConfig', () => {
  it('returns an injectable decorator factory', () => {
    expect(typeof InjectFormsConfig()).toBe('function');
  });
});
