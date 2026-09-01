import { IdentityStore } from '@anarchitects/identity-angular/state';
import {
  UserProfileEditor,
  UserProfileView,
} from '@anarchitects/identity-angular/ui';
import type { UpdateUserProfileRequestDTO } from '@anarchitects/identity-ts';
import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
} from '@angular/core';

@Component({
  selector: 'anarchitects-user-profile',
  imports: [UserProfileEditor, UserProfileView],
  templateUrl: './user-profile-feature.html',
  styleUrl: './user-profile-feature.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UserProfileFeature {
  readonly authUserId = input.required<string>();
  readonly store = inject(IdentityStore);

  constructor() {
    effect(() => {
      const authUserId = this.authUserId();
      void this.store.loadProfile(authUserId);
    });
  }

  updateProfile(dto: UpdateUserProfileRequestDTO): void {
    void this.store.updateProfile(dto);
  }
}
