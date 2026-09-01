import { provideHttpClient } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { IDENTITY_CONFIG } from '@anarchitects/identity-angular/config';
import { IdentityApi } from '@anarchitects/identity-angular/data-access';
import { IdentityStore } from '@anarchitects/identity-angular/state';
import { provideIdentityFeature } from './providers';

describe('provideIdentityFeature', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should compose config, data access, and state providers', () => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        ...provideIdentityFeature({
          apiResourcePath: 'profiles',
        }),
      ],
    });

    expect(TestBed.inject(IDENTITY_CONFIG).apiResourcePath).toBe('profiles');
    expect(TestBed.inject(IdentityApi)).toBeDefined();
    expect(TestBed.inject(IdentityStore).profile()).toBeNull();
  });
});
