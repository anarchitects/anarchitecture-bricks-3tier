import { AuthStore } from '@anarchitects/auth-angular/state';
import { AnarchitectsAuthUiResetPasswordForm } from '@anarchitects/auth-angular/ui';
import { ResetPasswordRequestDTO } from '@anarchitects/auth-ts/dtos';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import type { FormsLayoutId } from '@anarchitects/forms-angular/config';
import type { FormsSchemaExtension } from '@anarchitects/forms-angular/ui';

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
  readonly layout = input<FormsLayoutId | null>(null);
  readonly schemaExtensions = input<readonly FormsSchemaExtension[]>([]);
  readonly layoutOptions = input<Readonly<Record<string, unknown>>>({});

  async submitForm(input: ResetPasswordRequestDTO): Promise<void> {
    if (!input.token) {
      return;
    }

    await this.authStore.resetPassword({ dto: input });
  }
}
