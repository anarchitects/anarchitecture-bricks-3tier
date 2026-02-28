import { AuthStore } from '@anarchitects/auth-angular/state';
import { ChangePasswordRequestDTO } from '@anarchitects/auth-ts/dtos';
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
  selector: 'anarchitects-auth-feature-change-password',
  imports: [AnarchitectsUiForm],
  templateUrl: './change-password.html',
  styleUrl: './change-password.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AnarchitectsFeatureChangePassword {
  private readonly authStore = inject(AuthStore);
  readonly userId = input<string>();
  readonly formConfig = signal<FormConfig>({
    id: 'change-password',
    version: 1,
    fields: [
      {
        name: 'currentPassword',
        kind: 'password',
        required: true,
        minLength: 6,
        ui: { label: 'Current Password' },
      },
      {
        name: 'newPassword',
        kind: 'password',
        required: true,
        minLength: 6,
        ui: { label: 'New Password' },
      },
      {
        name: 'confirmPassword',
        kind: 'password',
        required: true,
        minLength: 6,
        ui: { label: 'Confirm Password' },
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

    const dto: ChangePasswordRequestDTO = {
      currentPassword: input.payload['currentPassword'] as string,
      newPassword: input.payload['newPassword'] as string,
      confirmPassword: input.payload['confirmPassword'] as string,
    };

    await this.authStore.changePassword({ userId, dto });
  }
}
