import { RegisterRequestDTO } from '@anarchitects/auth-ts/dtos';
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
  readonly layout = input<AnxLayoutId | null>(null);
  readonly layoutOptions = input<Readonly<Record<string, unknown>>>({});
  readonly submitted = output<RegisterRequestDTO>();

  readonly formConfig = computed(() => registerFormBridge.resolveFormConfig());

  onSubmitted(input: SubmissionRequestDTO): void {
    const dto = registerFormBridge.mapSubmission(input);
    if (dto) {
      this.submitted.emit(dto);
    }
  }
}
