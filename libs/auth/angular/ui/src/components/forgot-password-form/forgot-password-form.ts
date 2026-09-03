import { ForgotPasswordRequestDTO } from '@anarchitects/auth-ts/dtos';
import { injectAuthContracts } from '@anarchitects/auth-angular/config';
import { AnarchitectsUiForm } from '@anarchitects/forms-angular/ui';
import type { FormsSchemaExtension } from '@anarchitects/forms-angular/ui';
import { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import type { FormsLayoutId } from '@anarchitects/forms-angular/config';
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
  private readonly authContracts = injectAuthContracts();

  readonly layout = input<FormsLayoutId | null>(null);
  readonly schemaExtensions = input<readonly FormsSchemaExtension[]>([]);
  readonly layoutOptions = input<Readonly<Record<string, unknown>>>({});
  readonly submitted = output<ForgotPasswordRequestDTO>();

  readonly formConfig = computed(() =>
    forgotPasswordFormBridge.resolveFormConfig(this.authContracts),
  );

  onSubmitted(input: SubmissionRequestDTO): void {
    const dto = forgotPasswordFormBridge.mapSubmission(
      input,
      this.authContracts,
    );
    if (dto) {
      this.submitted.emit(dto);
    }
  }
}
