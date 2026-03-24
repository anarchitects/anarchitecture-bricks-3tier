import { RefreshTokenRequestDTO } from '@anarchitects/auth-ts/dtos';
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
import { refreshTokensFormBridge } from '../../internal/auth-form-bridges';

@Component({
  selector: 'anarchitects-auth-ui-refresh-tokens-form',
  imports: [AnarchitectsUiForm],
  templateUrl: './refresh-tokens-form.html',
  styleUrl: './refresh-tokens-form.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'anx-domain-component anx-auth-ui-refresh-tokens-form anx-stack',
    'attr.data-anx-component': '"auth-ui-refresh-tokens-form"',
  },
})
export class AnarchitectsAuthUiRefreshTokensForm {
  readonly layout = input<AnxLayoutId | null>(null);
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
