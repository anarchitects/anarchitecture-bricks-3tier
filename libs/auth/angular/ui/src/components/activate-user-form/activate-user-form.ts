import { ActivateUserRequestDTO } from '@anarchitects/auth-ts/dtos';
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
  selector: 'anarchitects-auth-ui-activate-user-form',
  imports: [AnarchitectsUiForm],
  templateUrl: './activate-user-form.html',
  styleUrl: './activate-user-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'anx-domain-component anx-auth-ui-activate-user-form anx-stack',
    'attr.data-anx-component': '"auth-ui-activate-user-form"',
  },
})
export class AnarchitectsAuthUiActivateUserForm {
  readonly token = input<string>();
  readonly layout = input<AnxLayoutId | null>(null);
  readonly layoutOptions = input<Readonly<Record<string, unknown>>>({});
  readonly submitted = output<ActivateUserRequestDTO>();

  readonly formConfig = computed<FormConfig>(() => ({
    id: 'activate-user',
    version: 1,
    fields: [
      {
        name: 'token',
        kind: 'string',
        required: !this.token(),
        minLength: 1,
        ui: { label: 'Activation Token' },
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
