import { AuthStore } from '@anarchitects/auth-angular/state';
import { AnarchitectsAuthUiActivateUserForm } from '@anarchitects/auth-angular/ui';
import { ActivateUserRequestDTO } from '@anarchitects/auth-ts/dtos';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import type { FormsLayoutId } from '@anarchitects/forms-angular/config';
import type { FormsSchemaExtension } from '@anarchitects/forms-angular/ui';

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
  readonly layout = input<FormsLayoutId | null>(null);
  readonly schemaExtensions = input<readonly FormsSchemaExtension[]>([]);
  readonly layoutOptions = input<Readonly<Record<string, unknown>>>({});

  async submitForm(input: ActivateUserRequestDTO): Promise<void> {
    if (!input.token) {
      return;
    }

    await this.authStore.activateUser(input);
  }
}
