import { EnvironmentProviders, Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthApi } from '../../data-access/src';
import { AUTH_STATE_OPTIONS } from './auth-state.options';
import { AuthStore } from './auth.store';
import { provideAuthState } from './auth-state.provider';

describe('provideAuthState', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should be a function', () => {
    expect(typeof provideAuthState).toBe('function');
  });

  it('should return provider array with store, options, and initializer', () => {
    const providers = provideAuthState();

    expect(Array.isArray(providers)).toBe(true);
    expect(providers).toContain(AuthStore);
    expect(
      providers.some(
        (provider) =>
          typeof provider === 'object' &&
          provider !== null &&
          'provide' in provider &&
          provider.provide === AUTH_STATE_OPTIONS,
      ),
    ).toBe(true);
    expect(providers).toHaveLength(3);
  });

  it('should be assignable to Angular provider arrays', () => {
    const providers: Array<Provider | EnvironmentProviders> = provideAuthState();
    expect(providers).toBeDefined();
  });

  it('should eagerly instantiate the store through the initializer', () => {
    const mockAuthApi = {
      getLoggedInUserInfo: vi.fn(),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: AuthApi, useValue: mockAuthApi },
        ...provideAuthState(),
      ],
    });

    expect(TestBed.inject(AuthStore).initialized()).toBe(true);
  });

  it('should allow options overrides', () => {
    const providers = provideAuthState({
      restoreOnInit: false,
      onRestoreFailure: 'redirectToLogin',
    });
    const optionsProvider = providers.find(
      (provider): provider is { provide: object; useValue: object } =>
        typeof provider === 'object' &&
        provider !== null &&
        'provide' in provider &&
        provider.provide === AUTH_STATE_OPTIONS,
    );

    expect(optionsProvider?.useValue).toEqual({
      onRestoreFailure: 'redirectToLogin',
      restoreOnInit: false,
    });
  });
});
