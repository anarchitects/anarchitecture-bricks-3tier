import { AuthStore } from '@anarchitects/auth-angular/state';
import { AnarchitectsAuthUiVerifyEmailForm } from '@anarchitects/auth-angular/ui';
import { VerifyEmailRequestDTO } from '@anarchitects/auth-ts/dtos';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import type { FormsLayoutId } from '@anarchitects/forms-angular/config';
import type { FormsSchemaExtension } from '@anarchitects/forms-angular/ui';

@Component({
  selector: 'anarchitects-auth-feature-verify-email',
  imports: [AnarchitectsAuthUiVerifyEmailForm],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnarchitectsFeatureVerifyEmail {
  private readonly authStore = inject(AuthStore);

  readonly token = input<string>();
  readonly layout = input<FormsLayoutId | null>(null);
  readonly schemaExtensions = input<readonly FormsSchemaExtension[]>([]);
  readonly layoutOptions = input<Readonly<Record<string, unknown>>>({});

  async submitForm(input: VerifyEmailRequestDTO): Promise<void> {
    if (!input.token) {
      return;
    }

    await this.authStore.verifyEmail(input);
  }
}
