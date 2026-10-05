import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { AuthStore } from '@anarchitects/auth-angular/state';
import {
  AuthPasskeyStore,
  type PasskeyEnrollmentOptions,
} from '@anarchitects/auth-angular/state/passkeys';
import {
  AnarchitectsAuthUiPasskeys,
  type PasskeyMode,
  type PasskeyUiLabels,
} from '@anarchitects/auth-angular/ui/passkeys';

/** Orchestrates passkeys using an explicitly provided state scope. */
@Component({
  selector: 'anarchitects-auth-passkeys',
  imports: [AnarchitectsAuthUiPasskeys],
  templateUrl: './passkeys.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnarchitectsAuthPasskeys {
  readonly passkeys = inject(AuthPasskeyStore);
  private readonly auth = inject(AuthStore);
  readonly mode = input<PasskeyMode>('sign-in');
  readonly enrollmentOptions = input<PasskeyEnrollmentOptions>({});
  readonly disabled = input(false);
  readonly labels = input<Partial<PasskeyUiLabels>>({});
  readonly actionDisabled = computed(
    () =>
      this.disabled() ||
      this.auth.loading() ||
      this.auth.restoring() ||
      (this.mode() === 'enroll' && !this.auth.isLoggedIn()),
  );

  request(): void {
    if (this.actionDisabled() || this.passkeys.loading()) return;
    if (this.mode() === 'enroll')
      this.passkeys.enroll(this.enrollmentOptions());
    else this.passkeys.signIn();
  }
}
