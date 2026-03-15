import { ForgotPasswordRequestDTO } from '@anarchitects/auth-ts/dtos';
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
  selector: 'anarchitects-auth-ui-forgot-password-form',
  imports: [AnarchitectsUiForm],
  templateUrl: './forgot-password-form.html',
  styleUrl: './forgot-password-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'anx-domain-component anx-auth-ui-forgot-password-form anx-stack',
    'attr.data-anx-component': '"auth-ui-forgot-password-form"',
  },
})
export class AnarchitectsAuthUiForgotPasswordForm {
  readonly layout = input<AnxLayoutId | null>(null);
  readonly layoutOptions = input<Readonly<Record<string, unknown>>>({});
  readonly submitted = output<ForgotPasswordRequestDTO>();

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

  onSubmitted(input: SubmissionRequestDTO): void {
    this.submitted.emit({
      email: input.payload['email'] as string,
    });
  }
}
