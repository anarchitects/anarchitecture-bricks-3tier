import { RegisterRequestDTO } from '@anarchitects/auth-ts/dtos';
import { AnarchitectsUiForm } from '@anarchitects/forms-angular/ui';
import { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';
import { FormConfig } from '@anarchitects/forms-ts/models';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';
import type { AnxLayoutId } from '@anarchitects/common-angular-ui-layouts/contracts';

@Component({
  selector: 'anarchitects-auth-ui-register-form',
  imports: [AnarchitectsUiForm],
  templateUrl: './register-form.html',
  styleUrl: './register-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'anx-domain-component anx-auth-ui-register-form anx-stack',
    'attr.data-anx-component': '"auth-ui-register-form"',
  },
})
export class AnarchitectsAuthUiRegisterForm {
  readonly layout = input<AnxLayoutId | null>(null);
  readonly layoutOptions = input<Readonly<Record<string, unknown>>>({});
  readonly submitted = output<RegisterRequestDTO>();

  readonly formConfig = signal<FormConfig>({
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

  onSubmitted(input: SubmissionRequestDTO): void {
    this.submitted.emit({
      userName: input.payload['userName'] as string | undefined,
      email: input.payload['email'] as string,
      password: input.payload['password'] as string,
      confirmPassword: input.payload['confirmPassword'] as string,
    });
  }
}
