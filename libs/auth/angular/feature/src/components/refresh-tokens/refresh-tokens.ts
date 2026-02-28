import { AuthStore } from '@anarchitects/auth-angular/state';
import { RefreshTokenRequestDTO } from '@anarchitects/auth-ts/dtos';
import { AnarchitectsUiForm } from '@anarchitects/forms-angular/ui';
import { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';
import { FormConfig } from '@anarchitects/forms-ts/models';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
} from '@angular/core';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'anarchitects-auth-feature-refresh-tokens',
  imports: [AnarchitectsUiForm],
  templateUrl: './refresh-tokens.html',
  styleUrl: './refresh-tokens.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnarchitectsFeatureRefreshTokens {
  private readonly authStore = inject(AuthStore);
  readonly userId = input<string>();
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

  private resolveUserId(): string | undefined {
    const fromInput = this.userId();
    if (fromInput) {
      return fromInput;
    }

    const fromStore = this.authStore.loggedInUser()?.id;
    if (fromStore) {
      return fromStore;
    }

    const accessToken = localStorage.getItem('accessToken');
    if (!accessToken) {
      return undefined;
    }

    try {
      const decoded = jwtDecode<{ sub?: string }>(accessToken);
      return decoded.sub;
    } catch {
      return undefined;
    }
  }

  async submitForm(input: SubmissionRequestDTO) {
    const userId = this.resolveUserId();

    if (!userId) {
      return;
    }

    const refreshToken =
      (input.payload['refreshToken'] as string | undefined) ||
      localStorage.getItem('refreshToken') ||
      undefined;

    if (!refreshToken) {
      return;
    }

    const dto: RefreshTokenRequestDTO = { refreshToken };
    await this.authStore.refreshTokens({ userId, dto });
  }
}
