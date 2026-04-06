import { LoginRequestDTO } from '@anarchitects/auth-ts/dtos';
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
import { loginFormBridge } from '../../internal/auth-form-bridges';

@Component({
  selector: 'anarchitects-auth-ui-login-form',
  imports: [AnarchitectsUiForm],
  templateUrl: './login-form.html',
  styleUrl: './login-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'anx-domain-component anx-auth-ui-login-form anx-stack',
    'attr.data-anx-component': '"auth-ui-login-form"',
  },
})
export class AnarchitectsAuthUiLoginForm {
  private readonly authContracts = injectAuthContracts();

  readonly layout = input<AnxLayoutId | null>(null);
  readonly layoutOptions = input<Readonly<Record<string, unknown>>>({});
  readonly submitted = output<LoginRequestDTO>();

  readonly formConfig = computed(() =>
    loginFormBridge.resolveFormConfig(this.authContracts),
  );

  onSubmitted(input: SubmissionRequestDTO): void {
    const dto = loginFormBridge.mapSubmission(input, this.authContracts);
    if (dto) {
      this.submitted.emit(dto);
    }
  }
}
