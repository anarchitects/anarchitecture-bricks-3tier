import { importEsmModule } from './dynamic-import';

export type BetterAuthModule = typeof import('better-auth');
export type BetterAuthPasskeyModule = typeof import('@better-auth/passkey');
export type BetterAuthMigrationModule =
  typeof import('better-auth/db/migration');

export type BetterAuthRuntimeModules = {
  betterAuth: BetterAuthModule;
  betterAuthPasskey: BetterAuthPasskeyModule;
  betterAuthMigration: BetterAuthMigrationModule;
};

export async function loadBetterAuthRuntimeModules(): Promise<BetterAuthRuntimeModules> {
  const [betterAuth, betterAuthPasskey, betterAuthMigration] =
    await Promise.all([
      importEsmModule<BetterAuthModule>('better-auth'),
      importEsmModule<BetterAuthPasskeyModule>('@better-auth/passkey'),
      importEsmModule<BetterAuthMigrationModule>('better-auth/db/migration'),
    ]);

  return {
    betterAuth,
    betterAuthPasskey,
    betterAuthMigration,
  };
}
