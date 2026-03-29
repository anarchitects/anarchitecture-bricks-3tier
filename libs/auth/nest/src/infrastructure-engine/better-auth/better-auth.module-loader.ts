import { importEsmModule } from './dynamic-import';

export type BetterAuthModule = typeof import('better-auth');
export type BetterAuthAdaptersModule = typeof import('better-auth/adapters');
export type BetterAuthPasskeyModule = typeof import('@better-auth/passkey');
export type BetterAuthMigrationModule =
  typeof import('better-auth/db/migration');
export type BetterAuthTypeormAdapterModule =
  typeof import('@anarchitects/better-auth-typeorm-adapter');

export type BetterAuthRuntimeModules = {
  betterAuth: BetterAuthModule;
  betterAuthAdapters: BetterAuthAdaptersModule;
  betterAuthPasskey: BetterAuthPasskeyModule;
  betterAuthMigration: BetterAuthMigrationModule;
};

export async function loadBetterAuthRuntimeModules(): Promise<BetterAuthRuntimeModules> {
  const [
    betterAuth,
    betterAuthAdapters,
    betterAuthPasskey,
    betterAuthMigration,
  ] = await Promise.all([
    importEsmModule<BetterAuthModule>('better-auth'),
    importEsmModule<BetterAuthAdaptersModule>('better-auth/adapters'),
    importEsmModule<BetterAuthPasskeyModule>('@better-auth/passkey'),
    importEsmModule<BetterAuthMigrationModule>('better-auth/db/migration'),
  ]);

  return {
    betterAuth,
    betterAuthAdapters,
    betterAuthPasskey,
    betterAuthMigration,
  };
}

export function loadBetterAuthTypeormAdapterModule(): Promise<BetterAuthTypeormAdapterModule> {
  return importEsmModule<BetterAuthTypeormAdapterModule>(
    '@anarchitects/better-auth-typeorm-adapter',
  );
}
