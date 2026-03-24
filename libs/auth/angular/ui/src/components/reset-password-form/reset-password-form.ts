import { ResetPasswordRequestDTO } from '@anarchitects/auth-ts/dtos';
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
import { resetPasswordFormBridge } from '../../internal/auth-form-bridges';

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

  readonly formConfig = computed(() =>
    resetPasswordFormBridge.resolveFormConfig({ token: this.token() }),
  );

  onSubmitted(input: SubmissionRequestDTO): void {
    const dto = resetPasswordFormBridge.mapSubmission(input, {
      token: this.token(),
    });
    if (dto) {
      this.submitted.emit(dto);
    }
  }
}
