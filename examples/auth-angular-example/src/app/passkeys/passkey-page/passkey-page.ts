import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterLink } from '@angular/router';
import { AuthStore } from '@anarchitects/auth-angular/state';
import {
  AuthPasskeyStore,
  provideAuthPasskeyState,
} from '@anarchitects/auth-angular/state/passkeys';

/** Host-owned composition; all auth behavior comes from public package entry points. */
@Component({
  selector: 'app-passkey-page',
  imports: [RouterLink],
  providers: [...provideAuthPasskeyState()],
  templateUrl: './passkey-page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class PasskeyPage {
  readonly auth = inject(AuthStore);
  readonly passkeys = inject(AuthPasskeyStore);

  signOut(): void {
    this.passkeys.cancel();
    this.auth.logout({});
  }
}
