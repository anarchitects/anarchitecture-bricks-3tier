import { VerifyEmailRequestDTO } from '@anarchitects/auth-ts/dtos';
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
  private readonly authContracts = injectAuthContracts();

  readonly token = input<string>();
  readonly layout = input<FormsLayoutId | null>(null);
  readonly schemaExtensions = input<readonly FormsSchemaExtension[]>([]);
  readonly layoutOptions = input<Readonly<Record<string, unknown>>>({});
  readonly submitted = output<VerifyEmailRequestDTO>();

  readonly formConfig = computed(() =>
    verifyEmailFormBridge.resolveFormConfig(this.authContracts, {
      token: this.token(),
    }),
  );

  onSubmitted(input: SubmissionRequestDTO): void {
    const dto = verifyEmailFormBridge.mapSubmission(input, this.authContracts, {
      token: this.token(),
    });
    if (dto) {
      this.submitted.emit(dto);
    }
  }
}
