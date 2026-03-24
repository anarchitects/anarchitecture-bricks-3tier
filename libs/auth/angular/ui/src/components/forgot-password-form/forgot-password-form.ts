import { ForgotPasswordRequestDTO } from '@anarchitects/auth-ts/dtos';
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
import { forgotPasswordFormBridge } from '../../internal/auth-form-bridges';

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

  readonly formConfig = computed(() =>
    forgotPasswordFormBridge.resolveFormConfig(),
  );

  onSubmitted(input: SubmissionRequestDTO): void {
    const dto = forgotPasswordFormBridge.mapSubmission(input);
    if (dto) {
      this.submitted.emit(dto);
    }
  }
}
