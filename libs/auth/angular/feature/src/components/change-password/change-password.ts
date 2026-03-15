import { AuthStore } from '@anarchitects/auth-angular/state';
import { AnarchitectsAuthUiChangePasswordForm } from '@anarchitects/auth-angular/ui';
import { ChangePasswordRequestDTO } from '@anarchitects/auth-ts/dtos';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import { jwtDecode } from 'jwt-decode';
import type { AnxLayoutId } from '@anarchitects/common-angular-ui-layouts/contracts';

@Component({
  selector: 'anarchitects-auth-feature-change-password',
  imports: [AnarchitectsAuthUiChangePasswordForm],
  templateUrl: './change-password.html',
  styleUrl: './change-password.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnarchitectsFeatureChangePassword {
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

  async submitForm(input: ChangePasswordRequestDTO): Promise<void> {
    const userId = this.resolveUserId();

    if (!userId) {
      return;
    }

    await this.authStore.changePassword({ userId, dto: input });
  }
}
