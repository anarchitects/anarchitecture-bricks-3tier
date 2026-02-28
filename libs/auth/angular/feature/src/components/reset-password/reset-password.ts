import { AuthStore } from '@anarchitects/auth-angular/state';
import { ResetPasswordRequestDTO } from '@anarchitects/auth-ts/dtos';
import { AnarchitectsUiForm } from '@anarchitects/forms-angular/ui';
import { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';
import { FormConfig } from '@anarchitects/forms-ts/models';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';

@Component({
  selector: 'anarchitects-auth-feature-reset-password',
  imports: [AnarchitectsUiForm],
  templateUrl: './reset-password.html',
  styleUrl: './reset-password.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnarchitectsFeatureResetPassword {
  private readonly authStore = inject(AuthStore);
  readonly token = input<string>();
  readonly formConfig = computed<FormConfig>(() => ({
    id: 'reset-password',
    version: 1,
    fields: [
      {
        name: 'token',
        kind: 'string',
        required: !this.token(),
        minLength: 1,
        ui: { label: 'Reset Token' },
      },
      {
        name: 'password',
        kind: 'password',
        required: true,
        minLength: 6,
        ui: { label: 'Password' },
      },
      {
        name: 'confirmPassword',
        kind: 'password',
        required: true,
        minLength: 6,
        ui: { label: 'Confirm Password' },
      },
    ],
  }));

  async submitForm(input: SubmissionRequestDTO) {
    const token =
      (input.payload['token'] as string | undefined) || this.token();

    if (!token) {
      return;
    }

    const dto: ResetPasswordRequestDTO = {
      token,
      password: input.payload['password'] as string,
      confirmPassword: input.payload['confirmPassword'] as string,
    };

    await this.authStore.resetPassword({ dto });
  }
}
