import { AuthStore } from '@anarchitects/auth-angular/state';
import { AnarchitectsAuthUiForgotPasswordForm } from '@anarchitects/auth-angular/ui';
import { ForgotPasswordRequestDTO } from '@anarchitects/auth-ts/dtos';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import type { FormsLayoutId } from '@anarchitects/forms-angular/config';
import type { FormsSchemaExtension } from '@anarchitects/forms-angular/ui';

@Component({
  selector: 'anarchitects-auth-feature-forgot-password',
  imports: [AnarchitectsAuthUiForgotPasswordForm],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnarchitectsFeatureForgotPassword {
  private readonly authStore = inject(AuthStore);

  readonly layout = input<FormsLayoutId | null>(null);
  readonly schemaExtensions = input<readonly FormsSchemaExtension[]>([]);
  readonly layoutOptions = input<Readonly<Record<string, unknown>>>({});

  async submitForm(input: ForgotPasswordRequestDTO): Promise<void> {
    await this.authStore.forgotPassword(input);
  }
}
