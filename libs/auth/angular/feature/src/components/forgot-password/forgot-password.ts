import { AuthStore } from '@anarchitects/auth-angular/state';
import { ForgotPasswordRequestDTO } from '@anarchitects/auth-ts/dtos';
import { AnarchitectsUiForm } from '@anarchitects/forms-angular/ui';
import { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';
import { FormConfig } from '@anarchitects/forms-ts/models';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';

@Component({
  selector: 'anarchitects-auth-feature-forgot-password',
  imports: [AnarchitectsUiForm],
  templateUrl: './forgot-password.html',
  styleUrl: './forgot-password.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnarchitectsFeatureForgotPassword {
  private readonly authStore = inject(AuthStore);
  readonly formConfig = signal<FormConfig>({
    id: 'forgot-password',
    version: 1,
    fields: [
      {
        name: 'email',
        kind: 'email',
        required: true,
        ui: { label: 'Email' },
      },
    ],
  });

  async submitForm(input: SubmissionRequestDTO) {
    const dto: ForgotPasswordRequestDTO = {
      email: input.payload['email'] as string,
    };

    await this.authStore.forgotPassword(dto);
  }
}
