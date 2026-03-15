import { UpdateEmailRequestDTO } from '@anarchitects/auth-ts/dtos';
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
  selector: 'anarchitects-auth-ui-update-email-form',
  imports: [AnarchitectsUiForm],
  templateUrl: './update-email-form.html',
  styleUrl: './update-email-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'anx-domain-component anx-auth-ui-update-email-form anx-stack',
    'attr.data-anx-component': '"auth-ui-update-email-form"',
  },
})
export class AnarchitectsAuthUiUpdateEmailForm {
  readonly layout = input<AnxLayoutId | null>(null);
  readonly layoutOptions = input<Readonly<Record<string, unknown>>>({});
  readonly submitted = output<UpdateEmailRequestDTO>();

  readonly formConfig = signal<FormConfig>({
    id: 'update-email',
    version: 1,
    fields: [
      {
        name: 'newEmail',
        kind: 'email',
        required: true,
        ui: { label: 'New Email' },
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
      newEmail: input.payload['newEmail'] as string,
      password: input.payload['password'] as string | undefined,
    });
  }
}
