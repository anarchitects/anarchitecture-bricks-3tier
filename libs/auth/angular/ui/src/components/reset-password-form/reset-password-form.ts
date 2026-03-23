import { ResetPasswordRequestDTO } from '@anarchitects/auth-ts/dtos';
import { AnarchitectsUiForm } from '@anarchitects/forms-angular/ui';
import { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';
import { FormConfig } from '@anarchitects/forms-ts/models';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import type { AnxLayoutId } from '@anarchitects/common-angular-ui-layouts/contracts';

@Component({
  selector: 'anarchitects-auth-ui-reset-password-form',
  imports: [AnarchitectsUiForm],
  templateUrl: './reset-password-form.html',
  styleUrl: './reset-password-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'anx-domain-component anx-auth-ui-reset-password-form anx-stack',
    'attr.data-anx-component': '"auth-ui-reset-password-form"',
  },
})
export class AnarchitectsAuthUiResetPasswordForm {
  readonly token = input<string>();
  readonly layout = input<AnxLayoutId | null>(null);
  readonly layoutOptions = input<Readonly<Record<string, unknown>>>({});
  readonly submitted = output<ResetPasswordRequestDTO>();

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
    validationRules: [
      {
        kind: 'matchFields',
        sourceField: 'password',
        targetField: 'confirmPassword',
        message: 'Passwords must match.',
      },
    ],
  }));

  onSubmitted(input: SubmissionRequestDTO): void {
    const token =
      (input.payload['token'] as string | undefined) || this.token();
    if (!token) {
      return;
    }

    this.submitted.emit({
      token,
      password: input.payload['password'] as string,
      confirmPassword: input.payload['confirmPassword'] as string,
    });
  }
}
