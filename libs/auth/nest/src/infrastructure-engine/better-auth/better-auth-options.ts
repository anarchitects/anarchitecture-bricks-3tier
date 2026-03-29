import type { BetterAuthOptions } from 'better-auth';
import type { ResolvedAuthApplicationModuleOptions } from '../../config';
import type { BetterAuthRuntimeModules } from './better-auth.module-loader';

export type BetterAuthLifecycleOptions = {
  hashPassword: (password: string) => Promise<string>;
  verifyPassword: (input: {
    hash: string;
    password: string;
  }) => Promise<boolean>;
  sendVerificationEmail: (input: {
    email: string;
    url: string;
    token: string;
  }) => Promise<void>;
  sendResetPassword: (input: {
    email: string;
    url: string;
    token: string;
  }) => Promise<void>;
};

export function createBetterAuthOptions(
  options: ResolvedAuthApplicationModuleOptions,
  database: BetterAuthOptions['database'],
  runtimeModules: BetterAuthRuntimeModules,
  lifecycle: BetterAuthLifecycleOptions,
): BetterAuthOptions {
  return {
    secret: options.betterAuth.secret,
    baseURL: options.betterAuth.baseUrl,
    trustedOrigins: collectTrustedOrigins(options),
    database,
    advanced: {
      database: {
        generateId: 'uuid',
      },
    },
    user: {
      modelName: 'users',
    },
    session: {
      modelName: 'sessions',
    },
    account: {
      modelName: 'accounts',
    },
    verification: {
      modelName: 'verifications',
    },
    emailVerification: {
      sendOnSignUp: true,
      autoSignInAfterVerification: false,
      sendVerificationEmail: async ({ user, url, token }) => {
        await lifecycle.sendVerificationEmail({
          email: user.email,
          url,
          token,
        });
      },
    },
    emailAndPassword: {
      enabled: true,
      autoSignIn: false,
      sendResetPassword: async ({ user, url, token }) => {
        await lifecycle.sendResetPassword({
          email: user.email,
          url,
          token,
        });
      },
      password: {
        hash: lifecycle.hashPassword,
        verify: lifecycle.verifyPassword,
      },
    },
    socialProviders: options.plugins.social.enabled
      ? {
          github: {
            clientId: options.plugins.social.github!.clientId!,
            clientSecret: options.plugins.social.github!.clientSecret!,
          },
        }
      : {},
    plugins: options.plugins.passkeys.enabled
      ? [
          runtimeModules.betterAuthPasskey.passkey({
            rpID: options.plugins.passkeys.rpID,
            rpName: options.plugins.passkeys.rpName,
            origin: options.plugins.passkeys.origin,
            schema: {
              passkey: {
                modelName: 'passkeys',
              },
            },
          }),
        ]
      : [],
  };
}

function collectTrustedOrigins(
  options: ResolvedAuthApplicationModuleOptions,
): string[] {
  const origins = [
    options.betterAuth.baseUrl,
    options.betterAuth.callbackUrls.verifyEmail,
    options.betterAuth.callbackUrls.resetPassword,
  ]
    .map((value) => {
      try {
        return new URL(value).origin;
      } catch {
        return null;
      }
    })
    .filter((value): value is string => Boolean(value));

  return [...new Set(origins)];
}
