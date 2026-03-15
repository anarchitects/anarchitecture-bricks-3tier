import { AuthStore } from '@anarchitects/auth-angular/state';
import { AnarchitectsAuthUiLogoutForm } from '@anarchitects/auth-angular/ui';
import { LogoutRequestDTO } from '@anarchitects/auth-ts/dtos';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import type { AnxLayoutId } from '@anarchitects/common-angular-ui-layouts/contracts';

@Component({
  selector: 'anarchitects-auth-feature-logout',
  imports: [AnarchitectsAuthUiLogoutForm],
  templateUrl: './logout.html',
  styleUrl: './logout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnarchitectsFeatureLogout {
  private readonly authStore = inject(AuthStore);

  readonly layout = input<AnxLayoutId | null>(null);
  readonly layoutOptions = input<Readonly<Record<string, unknown>>>({});

  async submitForm(input: LogoutRequestDTO): Promise<void> {
    if (!input.refreshToken) {
      return;
    }

    await this.authStore.logout(input);
  }
}
