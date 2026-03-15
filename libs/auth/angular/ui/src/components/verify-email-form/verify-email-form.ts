import { VerifyEmailRequestDTO } from '@anarchitects/auth-ts/dtos';
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
  selector: 'anarchitects-auth-ui-verify-email-form',
  imports: [AnarchitectsUiForm],
  templateUrl: './verify-email-form.html',
  styleUrl: './verify-email-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'anx-domain-component anx-auth-ui-verify-email-form anx-stack',
    'attr.data-anx-component': '"auth-ui-verify-email-form"',
  },
})
export class AnarchitectsAuthUiVerifyEmailForm {
  readonly token = input<string>();
  readonly layout = input<AnxLayoutId | null>(null);
  readonly layoutOptions = input<Readonly<Record<string, unknown>>>({});
  readonly submitted = output<VerifyEmailRequestDTO>();

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

  onSubmitted(input: SubmissionRequestDTO): void {
    const token =
      (input.payload['token'] as string | undefined) || this.token();
    if (!token) {
      return;
    }

    this.submitted.emit({ token });
  }
}
