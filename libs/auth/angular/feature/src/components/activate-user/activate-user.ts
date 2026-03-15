import { AuthStore } from '@anarchitects/auth-angular/state';
import { AnarchitectsAuthUiActivateUserForm } from '@anarchitects/auth-angular/ui';
import { ActivateUserRequestDTO } from '@anarchitects/auth-ts/dtos';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import type { AnxLayoutId } from '@anarchitects/common-angular-ui-layouts/contracts';

@Component({
  selector: 'anarchitects-auth-feature-activate-user',
  imports: [AnarchitectsAuthUiActivateUserForm],
  templateUrl: './activate-user.html',
  styleUrl: './activate-user.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnarchitectsFeatureActivateUser {
  private readonly authStore = inject(AuthStore);

  readonly token = input<string>();
  readonly layout = input<AnxLayoutId | null>(null);
  readonly layoutOptions = input<Readonly<Record<string, unknown>>>({});

  async submitForm(input: ActivateUserRequestDTO): Promise<void> {
    if (!input.token) {
      return;
    }

    await this.authStore.activateUser(input);
  }
}
