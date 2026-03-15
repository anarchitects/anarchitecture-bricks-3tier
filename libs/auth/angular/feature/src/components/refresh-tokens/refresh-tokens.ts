import { AuthStore } from '@anarchitects/auth-angular/state';
import { AnarchitectsAuthUiRefreshTokensForm } from '@anarchitects/auth-angular/ui';
import { RefreshTokenRequestDTO } from '@anarchitects/auth-ts/dtos';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import type { AnxLayoutId } from '@anarchitects/common-angular-ui-layouts/contracts';

@Component({
  selector: 'anarchitects-auth-feature-refresh-tokens',
  imports: [AnarchitectsAuthUiRefreshTokensForm],
  templateUrl: './refresh-tokens.html',
  styleUrl: './refresh-tokens.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnarchitectsFeatureRefreshTokens {
  private readonly authStore = inject(AuthStore);

  readonly userId = input<string>();
  readonly layout = input<AnxLayoutId | null>(null);
  readonly layoutOptions = input<Readonly<Record<string, unknown>>>({});

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

  async submitForm(input: RefreshTokenRequestDTO): Promise<void> {
    const userId = this.resolveUserId();

    if (!userId || !input.refreshToken) {
      return;
    }

    await this.authStore.refreshTokens({ userId, dto: input });
  }
}
