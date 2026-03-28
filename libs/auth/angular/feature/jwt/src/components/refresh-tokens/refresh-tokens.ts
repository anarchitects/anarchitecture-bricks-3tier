import type { AnxLayoutId } from '@anarchitects/common-angular-ui-layouts/contracts';
import { AuthJwtStore } from '@anarchitects/auth-angular/state/jwt';
import { RefreshTokenRequestDTO } from '@anarchitects/auth-ts/dtos/jwt';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { AnarchitectsAuthJwtRefreshTokensForm } from '@anarchitects/auth-angular/ui/jwt';

@Component({
  selector: 'anarchitects-auth-jwt-refresh-tokens',
  imports: [AnarchitectsAuthJwtRefreshTokensForm],
  templateUrl: './refresh-tokens.html',
  styleUrl: './refresh-tokens.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnarchitectsAuthJwtRefreshTokens {
  private readonly authJwtStore = inject(AuthJwtStore);

  readonly layout = input<AnxLayoutId | null>(null);
  readonly layoutOptions = input<Readonly<Record<string, unknown>>>({});

  async submitForm(input: RefreshTokenRequestDTO): Promise<void> {
    await this.authJwtStore.refreshTokens(input);
  }
}
