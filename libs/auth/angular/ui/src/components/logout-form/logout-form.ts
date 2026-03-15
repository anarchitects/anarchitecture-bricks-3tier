import { LogoutRequestDTO } from '@anarchitects/auth-ts/dtos';
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
  readonly layout = input<AnxLayoutId | null>(null);
  readonly layoutOptions = input<Readonly<Record<string, unknown>>>({});
  readonly submitted = output<LogoutRequestDTO>();

  readonly formConfig = signal<FormConfig>({
    id: 'logout',
    version: 1,
    fields: [
      {
        name: 'refreshToken',
        kind: 'string',
        required: false,
        minLength: 1,
        ui: { label: 'Refresh Token' },
      },
      {
        name: 'accessToken',
        kind: 'string',
        required: false,
        minLength: 1,
        ui: { label: 'Access Token (optional)' },
      },
    ],
  });

  onSubmitted(input: SubmissionRequestDTO): void {
    const refreshToken =
      (input.payload['refreshToken'] as string | undefined) ||
      localStorage.getItem('refreshToken') ||
      undefined;
    const accessToken =
      (input.payload['accessToken'] as string | undefined) ||
      localStorage.getItem('accessToken') ||
      undefined;

    if (!refreshToken) {
      return;
    }

    this.submitted.emit({
      refreshToken,
      ...(accessToken ? { accessToken } : {}),
    });
  }
}
