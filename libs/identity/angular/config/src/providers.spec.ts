import { TestBed } from '@angular/core/testing';
import { provideIdentityConfig, provideIdentityDefaults } from './providers';
import { IDENTITY_API_RESOURCE_PATH, IDENTITY_CONFIG } from './tokens';

describe('IdentityConfig providers', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should provide defaults when no overrides are supplied', () => {
    TestBed.configureTestingModule({
      providers: [...provideIdentityDefaults()],
    });

    const config = TestBed.inject(IDENTITY_CONFIG);
    const resourcePath = TestBed.inject(IDENTITY_API_RESOURCE_PATH);

    expect(config.apiResourcePath).toBe('identity');
    expect(resourcePath).toBe('identity');
  });

  it('should merge explicit config overrides', () => {
    TestBed.configureTestingModule({
      providers: [
        ...provideIdentityConfig({
          apiBaseUrl: 'https://api.example.test',
          apiResourcePath: 'profiles',
        }),
      ],
    });

    const config = TestBed.inject(IDENTITY_CONFIG);
    const resourcePath = TestBed.inject(IDENTITY_API_RESOURCE_PATH);

    expect(config.apiBaseUrl).toBe('https://api.example.test');
    expect(resourcePath).toBe('profiles');
  });
});
