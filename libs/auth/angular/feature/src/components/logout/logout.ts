import { AuthStore } from '@anarchitects/auth-angular/state';
import { AnarchitectsAuthUiLogoutForm } from '@anarchitects/auth-angular/ui';
import { LogoutRequestDTO } from '@anarchitects/auth-ts/dtos';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import type { FormsLayoutId } from '@anarchitects/forms-angular/config';
import type { FormsSchemaExtension } from '@anarchitects/forms-angular/ui';

@Component({
  selector: 'anarchitects-auth-feature-logout',
  imports: [AnarchitectsAuthUiLogoutForm],
  templateUrl: './logout.html',
  styleUrl: './logout.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnarchitectsFeatureLogout {
  private readonly authStore = inject(AuthStore);

  readonly layout = input<FormsLayoutId | null>(null);
  readonly schemaExtensions = input<readonly FormsSchemaExtension[]>([]);
  readonly layoutOptions = input<Readonly<Record<string, unknown>>>({});

  async submitForm(input: LogoutRequestDTO): Promise<void> {
    await this.authStore.logout(input);
  }
}
