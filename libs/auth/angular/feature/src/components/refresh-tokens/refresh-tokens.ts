import { AuthStore } from '@anarchitects/auth-angular/state';
import { AnarchitectsAuthUiRefreshTokensForm } from '@anarchitects/auth-angular/ui';
import { RefreshTokenRequestDTO } from '@anarchitects/auth-ts/dtos';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
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

  readonly layout = input<AnxLayoutId | null>(null);
  readonly layoutOptions = input<Readonly<Record<string, unknown>>>({});

  async submitForm(input: RefreshTokenRequestDTO): Promise<void> {
    if (!input.refreshToken) {
      return;
    }

    await this.authStore.refreshTokens(input);
  }
}
