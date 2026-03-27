import { Inject } from '@nestjs/common';
import { ConfigType, registerAs } from '@nestjs/config';
import type { CommonMailerProvider } from '@anarchitects/common-nest-mailer';

const AUTH_CONFIG_KEY = 'auth';

export const DEFAULT_AUTH_ENCRYPTION_ALGORITHM = 'bcrypt';
export const DEFAULT_AUTH_ENCRYPTION_KEY = 'default_encryption_key';
export const DEFAULT_AUTH_MAILER_PROVIDER = 'node';
export const DEFAULT_AUTH_BETTER_AUTH_BASE_URL =
  'http://localhost:3000/api/auth';
export const DEFAULT_AUTH_BETTER_AUTH_SECRET =
  'better-auth-secret-32-chars-minimum';
export const DEFAULT_AUTH_BETTER_AUTH_VERIFY_EMAIL_CALLBACK_URL =
  'http://localhost:3000/verify-email';
export const DEFAULT_AUTH_BETTER_AUTH_RESET_PASSWORD_CALLBACK_URL =
  'http://localhost:3000/reset-password';
export const DEFAULT_AUTH_PLUGIN_JWT_ENABLED = false;
export const DEFAULT_AUTH_PLUGIN_JWT_SECRET = 'default_jwt_secret';
export const DEFAULT_AUTH_PLUGIN_JWT_EXPIRATION = '3600s';
export const DEFAULT_AUTH_PLUGIN_JWT_AUDIENCE = 'your_audience';
export const DEFAULT_AUTH_PLUGIN_JWT_ISSUER = 'your_issuer';
export const DEFAULT_AUTH_PLUGIN_PASSKEYS_ENABLED = false;
export const DEFAULT_AUTH_PLUGIN_PASSKEY_RP_ID = 'localhost';
export const DEFAULT_AUTH_PLUGIN_PASSKEY_RP_NAME = 'Anarchitecture Auth';
export const DEFAULT_AUTH_PLUGIN_SOCIAL_ENABLED = false;
export const DEFAULT_AUTH_PLUGIN_OIDC_ENABLED = false;

const parseBoolean = (value: string | undefined, fallback = false): boolean => {
  if (value === undefined) {
    return fallback;
  }

  switch (value.trim().toLowerCase()) {
    case '1':
    case 'true':
    case 'yes':
    case 'on':
      return true;
    case '0':
    case 'false':
    case 'no':
    case 'off':
      return false;
    default:
      throw new Error(`Unsupported boolean value: ${value}`);
  }
};

const parseMailerProvider = (): CommonMailerProvider => {
  const value = process.env['AUTH_MAILER_PROVIDER'];
  if (value === undefined) {
    return DEFAULT_AUTH_MAILER_PROVIDER;
  }

  switch (value) {
    case 'node':
    case 'noop':
      return value;
    default:
      throw new Error(`Unsupported mailer provider: ${value}`);
  }
};

const deriveCallbackUrl = (
  baseUrl: string,
  pathname: string,
  fallback: string,
): string => {
  try {
    const parsedBaseUrl = new URL(baseUrl);
    return new URL(pathname, parsedBaseUrl.origin).toString();
  } catch {
    return fallback;
  }
};

export const authConfig = registerAs(AUTH_CONFIG_KEY, () => {
  const betterAuthBaseUrl =
    process.env['AUTH_BETTER_AUTH_BASE_URL'] ??
    DEFAULT_AUTH_BETTER_AUTH_BASE_URL;

  return {
    encryptionAlgorithm:
      process.env['AUTH_ENCRYPTION_ALGORITHM'] ??
      DEFAULT_AUTH_ENCRYPTION_ALGORITHM,
    encryptionKey:
      process.env['AUTH_ENCRYPTION_KEY'] ?? DEFAULT_AUTH_ENCRYPTION_KEY,
    mailerProvider: parseMailerProvider(),
    betterAuth: {
      baseUrl: betterAuthBaseUrl,
      secret:
        process.env['AUTH_BETTER_AUTH_SECRET'] ??
        DEFAULT_AUTH_BETTER_AUTH_SECRET,
      callbackUrls: {
        verifyEmail:
          process.env['AUTH_BETTER_AUTH_VERIFY_EMAIL_CALLBACK_URL'] ??
          deriveCallbackUrl(
            betterAuthBaseUrl,
            '/verify-email',
            DEFAULT_AUTH_BETTER_AUTH_VERIFY_EMAIL_CALLBACK_URL,
          ),
        resetPassword:
          process.env['AUTH_BETTER_AUTH_RESET_PASSWORD_CALLBACK_URL'] ??
          deriveCallbackUrl(
            betterAuthBaseUrl,
            '/reset-password',
            DEFAULT_AUTH_BETTER_AUTH_RESET_PASSWORD_CALLBACK_URL,
          ),
      },
    },
    plugins: {
      jwt: {
        enabled: parseBoolean(
          process.env['AUTH_PLUGIN_JWT_ENABLED'],
          DEFAULT_AUTH_PLUGIN_JWT_ENABLED,
        ),
        secret:
          process.env['AUTH_PLUGIN_JWT_SECRET'] ??
          process.env['AUTH_JWT_SECRET'] ??
          DEFAULT_AUTH_PLUGIN_JWT_SECRET,
        expiration:
          process.env['AUTH_PLUGIN_JWT_EXPIRATION'] ??
          process.env['AUTH_JWT_EXPIRATION'] ??
          DEFAULT_AUTH_PLUGIN_JWT_EXPIRATION,
        audience:
          process.env['AUTH_PLUGIN_JWT_AUDIENCE'] ??
          process.env['AUTH_JWT_AUDIENCE'] ??
          DEFAULT_AUTH_PLUGIN_JWT_AUDIENCE,
        issuer:
          process.env['AUTH_PLUGIN_JWT_ISSUER'] ??
          process.env['AUTH_JWT_ISSUER'] ??
          DEFAULT_AUTH_PLUGIN_JWT_ISSUER,
      },
      passkeys: {
        enabled: parseBoolean(
          process.env['AUTH_PLUGIN_PASSKEYS_ENABLED'] ??
            process.env['AUTH_FEATURE_PASSKEYS'],
          DEFAULT_AUTH_PLUGIN_PASSKEYS_ENABLED,
        ),
        rpID:
          process.env['AUTH_PLUGIN_PASSKEY_RP_ID'] ??
          process.env['AUTH_PASSKEY_RP_ID'] ??
          DEFAULT_AUTH_PLUGIN_PASSKEY_RP_ID,
        rpName:
          process.env['AUTH_PLUGIN_PASSKEY_RP_NAME'] ??
          process.env['AUTH_PASSKEY_RP_NAME'] ??
          DEFAULT_AUTH_PLUGIN_PASSKEY_RP_NAME,
        origin:
          process.env['AUTH_PLUGIN_PASSKEY_ORIGIN'] ??
          process.env['AUTH_PASSKEY_ORIGIN'],
      },
      social: {
        enabled: parseBoolean(
          process.env['AUTH_PLUGIN_SOCIAL_ENABLED'] ??
            process.env['AUTH_FEATURE_SOCIAL'],
          DEFAULT_AUTH_PLUGIN_SOCIAL_ENABLED,
        ),
        github: {
          clientId:
            process.env['AUTH_PLUGIN_SOCIAL_GITHUB_CLIENT_ID'] ??
            process.env['AUTH_SOCIAL_GITHUB_CLIENT_ID'],
          clientSecret:
            process.env['AUTH_PLUGIN_SOCIAL_GITHUB_CLIENT_SECRET'] ??
            process.env['AUTH_SOCIAL_GITHUB_CLIENT_SECRET'],
        },
      },
      oidc: {
        enabled: parseBoolean(
          process.env['AUTH_PLUGIN_OIDC_ENABLED'] ??
            process.env['AUTH_FEATURE_OIDC'],
          DEFAULT_AUTH_PLUGIN_OIDC_ENABLED,
        ),
      },
    },
  };
});

export type AuthConfig = ConfigType<typeof authConfig>;

export const InjectAuthConfig = () => Inject(authConfig.KEY);
