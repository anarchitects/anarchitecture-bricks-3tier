import { AuthStore } from '@anarchitects/auth-angular/state';
import { AnarchitectsAuthUiUpdateEmailForm } from '@anarchitects/auth-angular/ui';
import { UpdateEmailRequestDTO } from '@anarchitects/auth-ts/dtos';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
} from '@angular/core';
import type { FormsLayoutId } from '@anarchitects/forms-angular/config';
import type { FormsSchemaExtension } from '@anarchitects/forms-angular/ui';

@Component({
  selector: 'anarchitects-auth-feature-update-email',
  imports: [AnarchitectsAuthUiUpdateEmailForm],
  templateUrl: './update-email.html',
  styleUrl: './update-email.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnarchitectsFeatureUpdateEmail {
  private readonly authStore = inject(AuthStore);

  readonly userId = input<string>();
  readonly layout = input<FormsLayoutId | null>(null);
  readonly schemaExtensions = input<readonly FormsSchemaExtension[]>([]);
  readonly layoutOptions = input<Readonly<Record<string, unknown>>>({});

  private resolveUserId(): string | undefined {
    const fromInput = this.userId();
    if (fromInput) {
      return fromInput;
    }

    const fromStore = this.authStore.loggedInUser()?.id;
    return fromStore;
  }

  async submitForm(input: UpdateEmailRequestDTO): Promise<void> {
    const userId = this.resolveUserId();

    if (!userId) {
      return;
    }

    await this.authStore.updateEmail({ userId, dto: input });
  }
}
