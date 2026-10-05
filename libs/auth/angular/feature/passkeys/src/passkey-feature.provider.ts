import type { Provider } from '@angular/core';
import { provideAuthPasskeyState } from '@anarchitects/auth-angular/state/passkeys';

/** Provide in the host scope alongside a visible core AuthStore. */
export function provideAuthPasskeyFeature(): Provider[] {
  return provideAuthPasskeyState();
}
