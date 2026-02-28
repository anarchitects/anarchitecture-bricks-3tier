import { AuthStore } from '@anarchitects/auth-angular/state';
import { VerifyEmailRequestDTO } from '@anarchitects/auth-ts/dtos';
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
  selector: 'anarchitects-auth-feature-verify-email',
  imports: [AnarchitectsUiForm],
  templateUrl: './verify-email.html',
  styleUrl: './verify-email.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnarchitectsFeatureVerifyEmail {
  private readonly authStore = inject(AuthStore);
  readonly token = input<string>();
  readonly formConfig = computed<FormConfig>(() => ({
    id: 'verify-email',
    version: 1,
    fields: [
      {
        name: 'token',
        kind: 'string',
        required: !this.token(),
        minLength: 1,
        ui: { label: 'Verification Token' },
      },
    ],
  }));

  async submitForm(input: SubmissionRequestDTO) {
    const token =
      (input.payload['token'] as string | undefined) || this.token();

    if (!token) {
      return;
    }

    const dto: VerifyEmailRequestDTO = { token };
    await this.authStore.verifyEmail(dto);
  }
}
