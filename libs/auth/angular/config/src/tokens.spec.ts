import { TestBed } from '@angular/core/testing';
import {
  AUTH_CONFIG,
  AUTH_DEFAULTS,
  AuthConfig,
  injectAuthConfig,
} from './tokens';

describe('AuthConfig', () => {
  it('should provide default values', () => {
    TestBed.configureTestingModule({
      providers: [{ provide: AUTH_CONFIG, useValue: AUTH_DEFAULTS }],
    });
    TestBed.runInInjectionContext(() => {
      const config = TestBed.inject<AuthConfig>(AUTH_CONFIG);
      expect(config).toEqual(AUTH_DEFAULTS);
    });
  });
  it('should inject default values', () => {
    TestBed.runInInjectionContext(() => {
      const config = injectAuthConfig();
      expect(config).toEqual(AUTH_DEFAULTS);
    });
  });
  it('should allow overriding default values', () => {
    const customConfig: AuthConfig = {
      apiResourcePath: 'custom-auth',
    };
    TestBed.configureTestingModule({
      providers: [{ provide: AUTH_CONFIG, useValue: customConfig }],
    });
    TestBed.runInInjectionContext(() => {
      const config = TestBed.inject<AuthConfig>(AUTH_CONFIG);
      expect(config).toEqual(customConfig);
    });
  });
});
