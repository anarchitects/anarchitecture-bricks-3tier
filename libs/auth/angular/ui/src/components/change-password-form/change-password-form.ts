import { ChangePasswordRequestDTO } from '@anarchitects/auth-ts/dtos';
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
  selector: 'anarchitects-auth-ui-change-password-form',
  imports: [AnarchitectsUiForm],
  templateUrl: './change-password-form.html',
  styleUrl: './change-password-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'anx-domain-component anx-auth-ui-change-password-form anx-stack',
    'attr.data-anx-component': '"auth-ui-change-password-form"',
  },
})
export class AnarchitectsAuthUiChangePasswordForm {
  readonly layout = input<AnxLayoutId | null>(null);
  readonly layoutOptions = input<Readonly<Record<string, unknown>>>({});
  readonly submitted = output<ChangePasswordRequestDTO>();

  readonly formConfig = signal<FormConfig>({
    id: 'change-password',
    version: 1,
    fields: [
      {
        name: 'currentPassword',
        kind: 'password',
        required: true,
        minLength: 6,
        ui: { label: 'Current Password' },
      },
      {
        name: 'newPassword',
        kind: 'password',
        required: true,
        minLength: 6,
        ui: { label: 'New Password' },
      },
      {
        name: 'confirmPassword',
        kind: 'password',
        required: true,
        minLength: 6,
        ui: { label: 'Confirm Password' },
      },
    ],
  });

  onSubmitted(input: SubmissionRequestDTO): void {
    this.submitted.emit({
      currentPassword: input.payload['currentPassword'] as string,
      newPassword: input.payload['newPassword'] as string,
      confirmPassword: input.payload['confirmPassword'] as string,
    });
  }
}
