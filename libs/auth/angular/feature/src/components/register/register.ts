import { AuthStore } from '@anarchitects/auth-angular/state';
import { RegisterRequestDTO } from '@anarchitects/auth-ts/dtos';
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
  selector: 'anarchitects-auth-feature-register',
  imports: [AnarchitectsUiForm],
  templateUrl: './register.html',
  styleUrl: './register.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnarchitectsFeatureRegister {
  private readonly authStore = inject(AuthStore);
  formConfig = signal<FormConfig>({
    id: 'register',
    version: 1,
    fields: [
      {
        name: 'userName',
        kind: 'string',
        ui: { label: 'Username' },
        required: false,
      },
      { name: 'email', kind: 'email', ui: { label: 'Email' }, required: true },
      {
        name: 'password',
        kind: 'password',
        ui: { label: 'Password' },
        required: true,
      },
      {
        name: 'confirmPassword',
        kind: 'password',
        ui: { label: 'Confirm Password' },
        required: true,
      },
    ],
  });

  async submitForm(input: SubmissionRequestDTO) {
    const registerInput: RegisterRequestDTO = {
      userName: input.payload['userName'] as string,
      email: input.payload['email'] as string,
      password: input.payload['password'] as string,
      confirmPassword: input.payload['confirmPassword'] as string,
    };
    await this.authStore.registerUser(registerInput);
  }
}
