import { TestBed } from '@angular/core/testing';
import { provideAuthConfig, provideAuthDefaults } from './providers';
import { API_RESOURCE_PATH, AUTH_CONFIG } from './tokens';

describe('AuthConfig Providers', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should provide default config when using provideAuthDefaults', () => {
    TestBed.configureTestingModule({
      providers: [...provideAuthDefaults()],
    });
    const config = TestBed.inject(AUTH_CONFIG);
    const apiResourcePath = TestBed.inject(API_RESOURCE_PATH);
    expect(config.apiResourcePath).toBe('auth');
    expect(apiResourcePath).toBe('auth');
  });
  it('should override config when using provideAuthConfig', () => {
    const customConfig = { apiResourcePath: 'custom-auth-path' };
    TestBed.configureTestingModule({
      providers: [...provideAuthConfig(customConfig)],
    });
    const config = TestBed.inject(AUTH_CONFIG);
    const apiResourcePath = TestBed.inject(API_RESOURCE_PATH);
    expect(config.apiResourcePath).toBe('custom-auth-path');
    expect(apiResourcePath).toBe('custom-auth-path');
  });
});
