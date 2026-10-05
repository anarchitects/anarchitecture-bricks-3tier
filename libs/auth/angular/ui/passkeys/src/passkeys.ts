import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';

export type PasskeyMode = 'sign-in' | 'enroll';
export interface PasskeyUiLabels {
  signIn: string;
  enroll: string;
  cancel: string;
  pending: string;
  completed: string;
  cancelled: string;
  unsupported: string;
}
const defaultLabels: PasskeyUiLabels = {
  signIn: 'Sign in with a passkey',
  enroll: 'Add a passkey',
  cancel: 'Cancel',
  pending: "Follow your browser's passkey prompt.",
  completed: 'Passkey request completed.',
  cancelled: 'Passkey request cancelled. You can try again.',
  unsupported:
    'Passkeys are not supported in this browser. Use password sign-in instead.',
};

/** Presentational actions without auth state, HTTP, or browser credential access. */
@Component({
  selector: 'anarchitects-auth-ui-passkeys',
  templateUrl: './passkeys.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'anx-domain-component anx-auth-ui-passkeys anx-stack',
    'attr.data-anx-component': '"auth-ui-passkeys"',
  },
})
export class AnarchitectsAuthUiPasskeys {
  readonly mode = input<PasskeyMode>('sign-in');
  readonly supported = input(false);
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly success = input(false);
  readonly cancelled = input(false);
  readonly error = input<string | null>(null);
  readonly labels = input<Partial<PasskeyUiLabels>>({});
  readonly text = computed(() => ({ ...defaultLabels, ...this.labels() }));
  readonly requested = output<void>();
  readonly cancelRequested = output<void>();
}
