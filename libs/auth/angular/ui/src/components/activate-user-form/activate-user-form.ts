import { ActivateUserRequestDTO } from '@anarchitects/auth-ts/dtos';
import { AnarchitectsUiForm } from '@anarchitects/forms-angular/ui';
import { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import type { AnxLayoutId } from '@anarchitects/common-angular-ui-layouts/contracts';
import { activateUserFormBridge } from '../../internal/auth-form-bridges';

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

  readonly formConfig = computed(() =>
    activateUserFormBridge.resolveFormConfig(undefined, {
      token: this.token(),
    }),
  );

  onSubmitted(input: SubmissionRequestDTO): void {
    const dto = activateUserFormBridge.mapSubmission(input, undefined, {
      token: this.token(),
    });
    if (dto) {
      this.submitted.emit(dto);
    }
  }
}
