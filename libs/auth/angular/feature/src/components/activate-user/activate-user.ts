import { AuthStore } from '@anarchitects/auth-angular/state';
import { ActivateUserRequestDTO } from '@anarchitects/auth-ts/dtos';
import { AnarchitectsUiForm } from '@anarchitects/forms-angular/ui';
import { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';
import { FormConfig } from '@anarchitects/forms-ts/models';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';

@Component({
  selector: 'anarchitects-auth-feature-activate-user',
  imports: [AnarchitectsUiForm],
  templateUrl: './activate-user.html',
  styleUrl: './activate-user.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnarchitectsFeatureActivateUser {
  private readonly authStore = inject(AuthStore);
  readonly token = input<string>();
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

  async submitForm(input: SubmissionRequestDTO) {
    const resolvedToken =
      (input.payload['token'] as string | undefined) || this.token();

    if (!resolvedToken) {
      return;
    }

    const dto: ActivateUserRequestDTO = { token: resolvedToken };
    await this.authStore.activateUser(dto);
  }
}
