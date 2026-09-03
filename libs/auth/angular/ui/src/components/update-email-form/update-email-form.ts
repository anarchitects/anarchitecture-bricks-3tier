import { UpdateEmailRequestDTO } from '@anarchitects/auth-ts/dtos';
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
import { updateEmailFormBridge } from '../../internal/auth-form-bridges';

@Component({
  selector: 'anarchitects-auth-ui-update-email-form',
  imports: [AnarchitectsUiForm],
  templateUrl: './update-email-form.html',
  styleUrl: './update-email-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'anx-domain-component anx-auth-ui-update-email-form anx-stack',
    'attr.data-anx-component': '"auth-ui-update-email-form"',
  },
})
export class AnarchitectsAuthUiUpdateEmailForm {
  readonly layout = input<FormsLayoutId | null>(null);
  readonly schemaExtensions = input<readonly FormsSchemaExtension[]>([]);
  readonly layoutOptions = input<Readonly<Record<string, unknown>>>({});
  readonly submitted = output<UpdateEmailRequestDTO>();

  readonly formConfig = computed(() =>
    updateEmailFormBridge.resolveFormConfig(),
  );

  onSubmitted(input: SubmissionRequestDTO): void {
    const dto = updateEmailFormBridge.mapSubmission(input);
    if (dto) {
      this.submitted.emit(dto);
    }
  }
}
