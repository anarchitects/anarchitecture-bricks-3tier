import type { FormsLayoutId } from '@anarchitects/forms-angular/config';
import { RefreshTokenRequestDTO } from '@anarchitects/auth-ts/dtos/jwt';
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
import { refreshTokensFormBridge } from '../../internal/refresh-tokens-form-bridge';

@Component({
  selector: 'anarchitects-auth-jwt-refresh-tokens-form',
  imports: [AnarchitectsUiForm],
  templateUrl: './refresh-tokens-form.html',
  styleUrl: './refresh-tokens-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'anx-domain-component anx-auth-jwt-refresh-tokens-form anx-stack',
    'attr.data-anx-component': '"auth-jwt-refresh-tokens-form"',
  },
})
export class AnarchitectsAuthJwtRefreshTokensForm {
  readonly layout = input<FormsLayoutId | null>(null);
  readonly schemaExtensions = input<readonly FormsSchemaExtension[]>([]);
  readonly layoutOptions = input<Readonly<Record<string, unknown>>>({});
  readonly submitted = output<RefreshTokenRequestDTO>();

  readonly formConfig = computed(() =>
    refreshTokensFormBridge.resolveFormConfig(),
  );

  onSubmitted(input: SubmissionRequestDTO): void {
    const dto = refreshTokensFormBridge.mapSubmission(input);
    if (dto) {
      this.submitted.emit(dto);
    }
  }
}
