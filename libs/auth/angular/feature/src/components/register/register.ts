import { AuthStore } from '@anarchitects/auth-angular/state';
import { AnarchitectsAuthUiRegisterForm } from '@anarchitects/auth-angular/ui';
import { RegisterRequestDTO } from '@anarchitects/auth-ts/dtos';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import type { FormsLayoutId } from '@anarchitects/forms-angular/config';
import type { FormsSchemaExtension } from '@anarchitects/forms-angular/ui';

@Component({
  selector: 'anarchitects-auth-feature-register',
  imports: [AnarchitectsAuthUiRegisterForm],
  templateUrl: './register.html',
  styleUrl: './register.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnarchitectsFeatureRegister {
  private readonly authStore = inject(AuthStore);

  readonly layout = input<FormsLayoutId | null>(null);
  readonly schemaExtensions = input<readonly FormsSchemaExtension[]>([]);
  readonly layoutOptions = input<Readonly<Record<string, unknown>>>({});

  async submitForm(input: RegisterRequestDTO): Promise<void> {
    await this.authStore.registerUser(input);
  }
}
