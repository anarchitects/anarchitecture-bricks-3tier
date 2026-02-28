import { AuthStore } from '@anarchitects/auth-angular/state';
import { LoginRequestDTO } from '@anarchitects/auth-ts/dtos';
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
  selector: 'anarchitects-auth-feature-login',
  imports: [AnarchitectsUiForm],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnarchitectsFeatureLogin {
  private readonly authStore = inject(AuthStore);
  formConfig = signal<FormConfig>({
    id: 'login',
    version: 1,
    fields: [
      {
        name: 'credential',
        kind: 'string',
        required: true,
        minLength: 2,
        maxLength: 100,
        ui: { label: 'Email or Username' },
      },
      {
        name: 'password',
        kind: 'password',
        required: true,
        minLength: 6,
        ui: { label: 'Password' },
      },
    ],
  });

  async submitForm(input: SubmissionRequestDTO) {
    const loginInput: LoginRequestDTO = {
      credential: input.payload['credential'] as string,
      password: input.payload['password'] as string,
    };
    await this.authStore.login(loginInput);
  }
}
