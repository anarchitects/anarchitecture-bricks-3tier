import { computed, Injectable, inject, signal } from '@angular/core';
import { IdentityApi } from '@anarchitects/identity-angular/data-access';
import type {
  UpdateUserProfileRequestDTO,
  UserProfileResponseDTO,
} from '@anarchitects/identity-ts';
import { firstValueFrom } from 'rxjs';

const toErrorMessage = (error: unknown): string => {
  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message;
  }

  if (
    error &&
    typeof error === 'object' &&
    'message' in error &&
    typeof error.message === 'string'
  ) {
    return error.message;
  }

  return 'Unable to complete the profile request.';
};

@Injectable()
export class IdentityStore {
  private readonly api = inject(IdentityApi);
  private readonly profileState = signal<UserProfileResponseDTO | null>(null);
  private readonly loadingState = signal(false);
  private readonly savingState = signal(false);
  private readonly errorState = signal<string | null>(null);

  readonly profile = this.profileState.asReadonly();
  readonly loading = this.loadingState.asReadonly();
  readonly saving = this.savingState.asReadonly();
  readonly error = this.errorState.asReadonly();
  readonly hasProfile = computed(() => this.profileState() !== null);

  async loadProfile(
    authUserId: string,
  ): Promise<UserProfileResponseDTO | undefined> {
    this.loadingState.set(true);
    this.errorState.set(null);

    try {
      const profile = await firstValueFrom(
        this.api.getProfileByAuthUserId(authUserId),
      );
      this.profileState.set(profile);
      return profile;
    } catch (error: unknown) {
      this.profileState.set(null);
      this.errorState.set(toErrorMessage(error));
      return undefined;
    } finally {
      this.loadingState.set(false);
    }
  }

  async updateProfile(
    dto: UpdateUserProfileRequestDTO,
  ): Promise<UserProfileResponseDTO | undefined> {
    const profileId = this.profileState()?.id;

    if (!profileId) {
      this.errorState.set('Load a profile before updating it.');
      return undefined;
    }

    this.savingState.set(true);
    this.errorState.set(null);

    try {
      const profile = await firstValueFrom(
        this.api.updateProfile(profileId, dto),
      );
      this.profileState.set(profile);
      return profile;
    } catch (error: unknown) {
      this.errorState.set(toErrorMessage(error));
      return undefined;
    } finally {
      this.savingState.set(false);
    }
  }

  clear(): void {
    this.profileState.set(null);
    this.loadingState.set(false);
    this.savingState.set(false);
    this.errorState.set(null);
  }
}
