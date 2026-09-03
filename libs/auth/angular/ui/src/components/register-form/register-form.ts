import { RegisterRequestDTO } from '@anarchitects/auth-ts/dtos';
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
import { registerFormBridge } from '../../internal/auth-form-bridges';

@Component({
  selector: 'anarchitects-auth-ui-register-form',
  imports: [AnarchitectsUiForm],
  templateUrl: './register-form.html',
  styleUrl: './register-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'anx-domain-component anx-auth-ui-register-form anx-stack',
    'attr.data-anx-component': '"auth-ui-register-form"',
  },
})
export class AnarchitectsAuthUiRegisterForm {
  private readonly authContracts = injectAuthContracts();

  readonly layout = input<FormsLayoutId | null>(null);
  readonly schemaExtensions = input<readonly FormsSchemaExtension[]>([]);
  readonly layoutOptions = input<Readonly<Record<string, unknown>>>({});
  readonly submitted = output<RegisterRequestDTO>();

  readonly formConfig = computed(() =>
    registerFormBridge.resolveFormConfig(this.authContracts),
  );

  onSubmitted(input: SubmissionRequestDTO): void {
    const dto = registerFormBridge.mapSubmission(input, this.authContracts);
    if (dto) {
      this.submitted.emit(dto);
    }
  }
}
