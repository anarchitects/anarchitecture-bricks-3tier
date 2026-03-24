import { importEsmModule } from './dynamic-import';

export type BetterAuthModule = typeof import('better-auth');
export type BetterAuthPasskeyModule = typeof import('@better-auth/passkey');

export type BetterAuthRuntimeModules = {
  betterAuth: BetterAuthModule;
  betterAuthPasskey: BetterAuthPasskeyModule;
};

export async function loadBetterAuthRuntimeModules(): Promise<BetterAuthRuntimeModules> {
  const [betterAuth, betterAuthPasskey] = await Promise.all([
    importEsmModule<BetterAuthModule>('better-auth'),
    importEsmModule<BetterAuthPasskeyModule>('@better-auth/passkey'),
  ]);

  return {
    betterAuth,
    betterAuthPasskey,
  };
}
