import { RefreshTokenRequestDTO } from '@anarchitects/auth-ts/dtos';
import { AnarchitectsUiForm } from '@anarchitects/forms-angular/ui';
import { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';
import { FormConfig } from '@anarchitects/forms-ts/models';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  output,
  signal,
} from '@angular/core';
import type { AnxLayoutId } from '@anarchitects/common-angular-ui-layouts/contracts';

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

  readonly formConfig = signal<FormConfig>({
    id: 'refresh-tokens',
    version: 1,
    fields: [
      {
        name: 'refreshToken',
        kind: 'string',
        required: false,
        minLength: 1,
        ui: { label: 'Refresh Token' },
      },
    ],
  });

  onSubmitted(input: SubmissionRequestDTO): void {
    const refreshToken =
      (input.payload['refreshToken'] as string | undefined) ||
      localStorage.getItem('refreshToken') ||
      undefined;

    if (!refreshToken) {
      return;
    }

    this.submitted.emit({ refreshToken });
  }
}
