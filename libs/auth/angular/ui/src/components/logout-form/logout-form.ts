import { LogoutRequestDTO } from '@anarchitects/auth-ts/dtos';
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
import { logoutFormBridge } from '../../internal/auth-form-bridges';

@Component({
  selector: 'anarchitects-auth-ui-logout-form',
  imports: [AnarchitectsUiForm],
  templateUrl: './logout-form.html',
  styleUrl: './logout-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'anx-domain-component anx-auth-ui-logout-form anx-stack',
    'attr.data-anx-component': '"auth-ui-logout-form"',
  },
})
export class AnarchitectsAuthUiLogoutForm {
  readonly layout = input<FormsLayoutId | null>(null);
  readonly schemaExtensions = input<readonly FormsSchemaExtension[]>([]);
  readonly layoutOptions = input<Readonly<Record<string, unknown>>>({});
  readonly submitted = output<LogoutRequestDTO>();

  readonly formConfig = computed(() => logoutFormBridge.resolveFormConfig());

  onSubmitted(input: SubmissionRequestDTO): void {
    const dto = logoutFormBridge.mapSubmission(input);
    if (dto) {
      this.submitted.emit(dto);
    }
  }
}
