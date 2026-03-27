import type { BetterAuthOptions } from 'better-auth';
import type { ResolvedAuthApplicationModuleOptions } from '../../config';
import type { BetterAuthRuntimeModules } from './better-auth.module-loader';

export function createBetterAuthOptions(
  options: ResolvedAuthApplicationModuleOptions,
  database: BetterAuthOptions['database'],
  runtimeModules: BetterAuthRuntimeModules,
): BetterAuthOptions {
  return {
    secret: options.spike.secret,
    baseURL: options.spike.baseUrl,
    database,
    emailAndPassword: {
      enabled: true,
    },
    socialProviders: options.features.social
      ? {
          github: {
            clientId:
              options.spike.socialProviders.github?.clientId ??
              'spike-client-id',
            clientSecret:
              options.spike.socialProviders.github?.clientSecret ??
              'spike-client-secret',
          },
        }
      : {},
    plugins: options.features.passkeys
      ? [
          runtimeModules.betterAuthPasskey.passkey({
            rpID: options.spike.passkeys.rpID,
            rpName: options.spike.passkeys.rpName,
            origin: options.spike.passkeys.origin,
          }),
        ]
      : [],
  };
}
