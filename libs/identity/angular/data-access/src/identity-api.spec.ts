import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient, withXhr } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideIdentityConfig } from '@anarchitects/identity-angular/config';
import type {
  UpdateUserProfileRequestDTO,
  UserProfileResponseDTO,
} from '@anarchitects/identity-ts';
import { IdentityApi } from './identity-api';
import { provideIdentityDataAccess } from './providers';

const profile: UserProfileResponseDTO = {
  id: 'profile-1',
  authUserId: 'auth-user-1',
  displayName: 'Ada Lovelace',
  givenName: 'Ada',
  familyName: 'Lovelace',
  avatarUrl: null,
  locale: 'en-GB',
  timeZone: 'Europe/London',
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-02T00:00:00.000Z',
};

describe('IdentityApi', () => {
  let api: IdentityApi;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
        ...provideIdentityConfig({
          apiBaseUrl: 'https://api.example.test/',
          apiResourcePath: '/identity/',
        }),
        ...provideIdentityDataAccess(),
      ],
    });

    api = TestBed.inject(IdentityApi);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
  });

  it('should load a profile by encoded auth user id', () => {
    let result: UserProfileResponseDTO | undefined;

    api.getProfileByAuthUserId('auth/user 1').subscribe((value) => {
      result = value;
    });

    const request = http.expectOne(
      'https://api.example.test/api/identity/profiles/by-auth-user/auth%2Fuser%201',
    );
    expect(request.request.method).toBe('GET');
    request.flush(profile);
    expect(result).toEqual(profile);
  });

  it('should update a profile with the shared request contract', () => {
    const dto: UpdateUserProfileRequestDTO = {
      displayName: 'Countess of Lovelace',
    };
    let result: UserProfileResponseDTO | undefined;

    api.updateProfile('profile/1', dto).subscribe((value) => {
      result = value;
    });

    const request = http.expectOne(
      'https://api.example.test/api/identity/profiles/profile%2F1',
    );
    expect(request.request.method).toBe('PATCH');
    expect(request.request.body).toEqual(dto);
    request.flush({ ...profile, ...dto });
    expect(result?.displayName).toBe('Countess of Lovelace');
  });
});
