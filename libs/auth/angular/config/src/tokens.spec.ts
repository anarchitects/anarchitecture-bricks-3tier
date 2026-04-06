import { TestBed } from '@angular/core/testing';
import {
  DefaultAuthContractConfig,
  createAuthContracts,
} from '@anarchitects/auth-ts';
import {
  AUTH_CONTRACTS,
  AUTH_CONFIG,
  AUTH_DEFAULTS,
  AuthConfig,
  injectAuthContracts,
  injectAuthConfig,
} from './tokens';

describe('AuthConfig', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

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
      plugins: {
        jwt: {
          enabled: true,
        },
      },
    };
    TestBed.configureTestingModule({
      providers: [{ provide: AUTH_CONFIG, useValue: customConfig }],
    });
    TestBed.runInInjectionContext(() => {
      const config = TestBed.inject<AuthConfig>(AUTH_CONFIG);
      expect(config).toEqual(customConfig);
    });
  });

  it('should inject default auth contracts when no provider is registered', () => {
    TestBed.runInInjectionContext(() => {
      const contracts = injectAuthContracts();

      expect(contracts.registerFormMeta.name.required).toBe(
        DefaultAuthContractConfig.register.name.required,
      );
      expect(contracts.loginFormMeta.password.minLength).toBe(
        DefaultAuthContractConfig.login.password.minLength,
      );
    });
  });

  it('should expose provided auth contracts overrides', () => {
    const contracts = createAuthContracts({
      ...DefaultAuthContractConfig,
      register: {
        ...DefaultAuthContractConfig.register,
        name: {
          ...DefaultAuthContractConfig.register.name,
          required: true,
        },
      },
    });

    TestBed.configureTestingModule({
      providers: [{ provide: AUTH_CONTRACTS, useValue: contracts }],
    });

    TestBed.runInInjectionContext(() => {
      expect(injectAuthContracts()).toBe(contracts);
    });
  });
});
