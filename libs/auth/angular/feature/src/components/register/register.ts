import { AuthStore } from '@anarchitects/auth-angular/state';
import { AnarchitectsAuthUiRegisterForm } from '@anarchitects/auth-angular/ui';
import { RegisterRequestDTO } from '@anarchitects/auth-ts/dtos';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import type { AnxLayoutId } from '@anarchitects/common-angular-ui-layouts/contracts';

@Component({
  selector: 'anarchitects-auth-feature-register',
  imports: [AnarchitectsAuthUiRegisterForm],
  templateUrl: './register.html',
  styleUrl: './register.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnarchitectsFeatureRegister {
  private readonly authStore = inject(AuthStore);

  readonly layout = input<AnxLayoutId | null>(null);
  readonly layoutOptions = input<Readonly<Record<string, unknown>>>({});

  async submitForm(input: RegisterRequestDTO): Promise<void> {
    await this.authStore.registerUser(input);
  }
}
