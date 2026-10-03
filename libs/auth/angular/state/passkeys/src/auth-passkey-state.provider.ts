import type { Provider } from '@angular/core';
import {
  PasskeyApi,
  WebAuthnClient,
} from '@anarchitects/auth-angular/data-access/passkeys';
import { AuthPasskeyStore } from './auth-passkey.store';

/** Provide alongside a visible AuthStore. Does not create another session store. */
export function provideAuthPasskeyState(): Provider[] {
  return [PasskeyApi, WebAuthnClient, AuthPasskeyStore];
}
