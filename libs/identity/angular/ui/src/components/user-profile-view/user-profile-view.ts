import type { UserProfileResponseDTO } from '@anarchitects/identity-ts';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';

@Component({
  selector: 'anarchitects-user-profile-view',
  imports: [],
  templateUrl: './user-profile-view.html',
  styleUrl: './user-profile-view.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserProfileView {
  readonly profile = input.required<UserProfileResponseDTO>();
  readonly avatarAlt = computed(
    () => `${this.profile().displayName ?? 'User'} profile avatar`,
  );
}
