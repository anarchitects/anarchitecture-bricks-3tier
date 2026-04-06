import { ChangePasswordRequestDTO } from '@anarchitects/auth-ts/dtos';
import { injectAuthContracts } from '@anarchitects/auth-angular/config';
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
import { changePasswordFormBridge } from '../../internal/auth-form-bridges';

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
  private readonly authContracts = injectAuthContracts();

  readonly layout = input<AnxLayoutId | null>(null);
  readonly layoutOptions = input<Readonly<Record<string, unknown>>>({});
  readonly submitted = output<ChangePasswordRequestDTO>();

  readonly formConfig = computed(() =>
    changePasswordFormBridge.resolveFormConfig(this.authContracts),
  );

  onSubmitted(input: SubmissionRequestDTO): void {
    const dto = changePasswordFormBridge.mapSubmission(
      input,
      this.authContracts,
    );
    if (dto) {
      this.submitted.emit(dto);
    }
  }
}
