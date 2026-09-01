import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import type {
  UpdateUserProfileRequestDTO,
  UserProfileResponseDTO,
} from '@anarchitects/identity-ts';
import {
  IDENTITY_API_BASE_URL,
  IDENTITY_API_RESOURCE_PATH,
} from '@anarchitects/identity-angular/config';

@Injectable()
export class IdentityApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = inject(IDENTITY_API_BASE_URL, { optional: true });
  private readonly resourcePath = inject(IDENTITY_API_RESOURCE_PATH);
  private readonly profilesUrl = `${this.normalizedBaseUrl()}/api/${this.normalizedResourcePath()}/profiles`;

  getProfileByAuthUserId(authUserId: string) {
    return this.http.get<UserProfileResponseDTO>(
      `${this.profilesUrl}/by-auth-user/${encodeURIComponent(authUserId)}`,
    );
  }

  updateProfile(profileId: string, dto: UpdateUserProfileRequestDTO) {
    return this.http.patch<UserProfileResponseDTO>(
      `${this.profilesUrl}/${encodeURIComponent(profileId)}`,
      dto,
    );
  }

  private normalizedBaseUrl(): string {
    return this.baseUrl?.replace(/\/$/, '') ?? '';
  }

  private normalizedResourcePath(): string {
    return this.resourcePath.replace(/^\/+|\/+$/g, '');
  }
}
