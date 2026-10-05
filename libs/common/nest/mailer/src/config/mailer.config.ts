import { Inject } from '@nestjs/common';
import { registerAs } from '@nestjs/config';

export const MAILER_CONFIG_KEY = 'mailerConfig';
export const DEFAULT_MAILER_PROVIDER = 'node';
export type CommonMailerProvider = 'node' | 'noop';
export type CommonMailerModuleOptions = {
  provider?: CommonMailerProvider;
};
export type ResolvedCommonMailerModuleOptions = {
  provider: CommonMailerProvider;
};

export type MailerConfig = {
  provider: CommonMailerProvider;
  host: string;
  port: number;
  secure: boolean;
  user: string;
  pass: string;
  default: string;
  ignoreTLS: boolean;
  /** Absolute path or a path relative to templateBaseDir (cwd by default). */
  templateDir: string;
  /** Base for relative template paths; absent or empty falls back to cwd. */
  templateBaseDir?: string;
};

const parseMailerProvider = (): CommonMailerProvider => {
  const value = process.env['MAILER_PROVIDER'] ?? DEFAULT_MAILER_PROVIDER;
  switch (value) {
    case 'node':
    case 'noop':
      return value;
    default:
      throw new Error(`Unsupported mailer provider: ${value}`);
  }
};

export const mailerConfig = registerAs(
  MAILER_CONFIG_KEY,
  (): MailerConfig => ({
    provider: parseMailerProvider(),
    host: process.env['MAILER_HOST'] ?? 'smtp.example.com',
    port: parseInt(process.env['MAILER_PORT'] ?? '587', 10),
    secure: process.env['MAILER_SECURE'] === 'true',
    user: process.env['MAILER_USER'] ?? 'user@example.com',
    pass: process.env['MAILER_PASS'] ?? 'password',
    default: process.env['MAILER_DEFAULT'] ?? 'default@example.com',
    ignoreTLS: process.env['MAILER_IGNORE_TLS'] === 'true',
    templateDir: process.env['MAILER_TEMPLATE_DIR'] ?? 'templates',
    templateBaseDir: process.env['MAILER_TEMPLATE_BASE_DIR'],
  }),
);

export const resolveCommonMailerModuleOptions = (
  options: CommonMailerModuleOptions = {},
): ResolvedCommonMailerModuleOptions => ({
  provider: options.provider ?? DEFAULT_MAILER_PROVIDER,
});

export const mapMailerConfigToModuleOptions = (
  config: MailerConfig,
): CommonMailerModuleOptions => ({
  provider: config.provider ?? DEFAULT_MAILER_PROVIDER,
});

export const InjectMailerConfig = () => Inject(mailerConfig.KEY);
