import { VerifyEmailRequestDTO } from '@anarchitects/auth-ts/dtos';
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
import { verifyEmailFormBridge } from '../../internal/auth-form-bridges';

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

  readonly formConfig = computed(() =>
    verifyEmailFormBridge.resolveFormConfig({ token: this.token() }),
  );

  onSubmitted(input: SubmissionRequestDTO): void {
    const dto = verifyEmailFormBridge.mapSubmission(input, {
      token: this.token(),
    });
    if (dto) {
      this.submitted.emit(dto);
    }
  }
}
