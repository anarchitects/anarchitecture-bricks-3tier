import { TestBed } from '@angular/core/testing';
import {
  provideAuthConfig,
  provideAuthContracts,
  provideAuthDefaults,
} from './providers';
import { API_RESOURCE_PATH, AUTH_CONFIG, AUTH_CONTRACTS } from './tokens';

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

  it('should provide default auth contracts when no overrides are supplied', () => {
    TestBed.configureTestingModule({
      providers: [...provideAuthContracts()],
    });

    const contracts = TestBed.inject(AUTH_CONTRACTS);

    expect(contracts.registerFormMeta.name.required).toBe(false);
    expect(contracts.loginFormMeta.password.minLength).toBe(6);
  });

  it('should merge nested auth contract overrides deterministically', () => {
    TestBed.configureTestingModule({
      providers: [
        ...provideAuthContracts({
          register: {
            name: {
              required: true,
              minLength: 3,
            },
          },
          login: {
            password: {
              minLength: 10,
            },
          },
        }),
      ],
    });

    const contracts = TestBed.inject(AUTH_CONTRACTS);

    expect(contracts.registerFormMeta.name.required).toBe(true);
    expect(contracts.registerFormMeta.name.minLength).toBe(3);
    expect(contracts.registerFormMeta.name.maxLength).toBe(100);
    expect(contracts.loginFormMeta.password.minLength).toBe(10);
    expect(contracts.loginFormMeta.credential.minLength).toBe(2);
  });
});
