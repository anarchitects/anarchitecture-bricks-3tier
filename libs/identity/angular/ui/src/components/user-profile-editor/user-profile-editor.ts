import type {
  UpdateUserProfileRequestDTO,
  UserProfileResponseDTO,
} from '@anarchitects/identity-ts';
import {
  ChangeDetectionStrategy,
  Component,
  input,
  linkedSignal,
  output,
} from '@angular/core';
import { form, FormField, submit as submitForm } from '@angular/forms/signals';

export type UserProfileFormModel = {
  displayName: string;
  givenName: string;
  familyName: string;
  avatarUrl: string;
  locale: string;
  timeZone: string;
};

const toFormModel = (
  profile: UserProfileResponseDTO,
): UserProfileFormModel => ({
  displayName: profile.displayName ?? '',
  givenName: profile.givenName ?? '',
  familyName: profile.familyName ?? '',
  avatarUrl: profile.avatarUrl ?? '',
  locale: profile.locale ?? '',
  timeZone: profile.timeZone ?? '',
});

const toNullableString = (value: string): string | null => value.trim() || null;

export const toUpdateUserProfileRequest = (
  model: UserProfileFormModel,
): UpdateUserProfileRequestDTO => ({
  displayName: toNullableString(model.displayName),
  givenName: toNullableString(model.givenName),
  familyName: toNullableString(model.familyName),
  avatarUrl: toNullableString(model.avatarUrl),
  locale: toNullableString(model.locale),
  timeZone: toNullableString(model.timeZone),
});

@Component({
  selector: 'anarchitects-user-profile-editor',
  imports: [FormField],
  templateUrl: './user-profile-editor.html',
  styleUrl: './user-profile-editor.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserProfileEditor {
  readonly profile = input.required<UserProfileResponseDTO>();
  readonly saving = input(false);
  readonly profileSubmitted = output<UpdateUserProfileRequestDTO>();

  readonly model = linkedSignal(() => toFormModel(this.profile()));
  readonly profileForm = form(this.model);

  submit(): void {
    void submitForm(this.profileForm, async () => {
      this.profileSubmitted.emit(toUpdateUserProfileRequest(this.model()));
    });
  }
}
