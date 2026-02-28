import { AuthStore } from '@anarchitects/auth-angular/state';
import { UpdateEmailRequestDTO } from '@anarchitects/auth-ts/dtos';
import { AnarchitectsUiForm } from '@anarchitects/forms-angular/ui';
import { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';
import { FormConfig } from '@anarchitects/forms-ts/models';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  signal,
} from '@angular/core';
import { jwtDecode } from 'jwt-decode';

@Component({
  selector: 'anarchitects-auth-feature-update-email',
  imports: [AnarchitectsUiForm],
  templateUrl: './update-email.html',
  styleUrl: './update-email.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnarchitectsFeatureUpdateEmail {
  private readonly authStore = inject(AuthStore);
  readonly userId = input<string>();
  readonly formConfig = signal<FormConfig>({
    id: 'update-email',
    version: 1,
    fields: [
      {
        name: 'newEmail',
        kind: 'email',
        required: true,
        ui: { label: 'New Email' },
      },
      {
        name: 'password',
        kind: 'password',
        required: true,
        minLength: 6,
        ui: { label: 'Password' },
      },
    ],
  });

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

  async submitForm(input: SubmissionRequestDTO) {
    const userId = this.resolveUserId();

    if (!userId) {
      return;
    }

    const dto: UpdateEmailRequestDTO = {
      newEmail: input.payload['newEmail'] as string,
      password: input.payload['password'] as string,
    };

    await this.authStore.updateEmail({ userId, dto });
  }
}
