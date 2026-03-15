import { AuthStore } from '@anarchitects/auth-angular/state';
import { AnarchitectsAuthUiResetPasswordForm } from '@anarchitects/auth-angular/ui';
import { ResetPasswordRequestDTO } from '@anarchitects/auth-ts/dtos';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import type { AnxLayoutId } from '@anarchitects/common-angular-ui-layouts/contracts';

@Component({
  selector: 'anarchitects-auth-feature-reset-password',
  imports: [AnarchitectsAuthUiResetPasswordForm],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnarchitectsFeatureResetPassword {
  private readonly authStore = inject(AuthStore);

  readonly token = input<string>();
  readonly layout = input<AnxLayoutId | null>(null);
  readonly layoutOptions = input<Readonly<Record<string, unknown>>>({});

  async submitForm(input: ResetPasswordRequestDTO): Promise<void> {
    if (!input.token) {
      return;
    }

    await this.authStore.resetPassword({ dto: input });
  }
}
