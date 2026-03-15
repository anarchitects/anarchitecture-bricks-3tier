import { AuthStore } from '@anarchitects/auth-angular/state';
import { AnarchitectsAuthUiLoginForm } from '@anarchitects/auth-angular/ui';
import { LoginRequestDTO } from '@anarchitects/auth-ts/dtos';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import type { AnxLayoutId } from '@anarchitects/common-angular-ui-layouts/contracts';

@Component({
  selector: 'anarchitects-auth-feature-login',
  imports: [AnarchitectsAuthUiLoginForm],
  templateUrl: './login.html',
  styleUrl: './login.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnarchitectsFeatureLogin {
  private readonly authStore = inject(AuthStore);

  readonly layout = input<AnxLayoutId | null>(null);
  readonly layoutOptions = input<Readonly<Record<string, unknown>>>({});

  async submitForm(input: LoginRequestDTO): Promise<void> {
    await this.authStore.login(input);
  }
}
