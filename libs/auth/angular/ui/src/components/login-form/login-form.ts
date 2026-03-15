import { LoginRequestDTO } from '@anarchitects/auth-ts/dtos';
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
  selector: 'anarchitects-auth-ui-login-form',
  imports: [AnarchitectsUiForm],
  templateUrl: './login-form.html',
  styleUrl: './login-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'anx-domain-component anx-auth-ui-login-form anx-stack',
    'attr.data-anx-component': '"auth-ui-login-form"',
  },
})
export class AnarchitectsAuthUiLoginForm {
  readonly layout = input<AnxLayoutId | null>(null);
  readonly layoutOptions = input<Readonly<Record<string, unknown>>>({});
  readonly submitted = output<LoginRequestDTO>();

  readonly formConfig = signal<FormConfig>({
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

  onSubmitted(input: SubmissionRequestDTO): void {
    this.submitted.emit({
      credential: input.payload['credential'] as string,
      password: input.payload['password'] as string,
    });
  }
}
