import { AuthStore } from '@anarchitects/auth-angular/state';
import { LogoutRequestDTO } from '@anarchitects/auth-ts/dtos';
import { AnarchitectsUiForm } from '@anarchitects/forms-angular/ui';
import { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';
import { FormConfig } from '@anarchitects/forms-ts/models';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';

@Component({
  selector: 'anarchitects-auth-feature-logout',
  imports: [AnarchitectsUiForm],
  templateUrl: './logout.html',
  styleUrl: './logout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnarchitectsFeatureLogout {
  private readonly authStore = inject(AuthStore);
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

  async submitForm(input: SubmissionRequestDTO) {
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

    const dto: LogoutRequestDTO = {
      refreshToken,
      ...(accessToken ? { accessToken } : {}),
    };

    await this.authStore.logout(dto);
  }
}
