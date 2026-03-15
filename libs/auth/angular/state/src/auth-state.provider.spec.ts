import { Provider } from '@angular/core';
import { AuthStore } from './auth.store';
import { provideAuthState } from './auth-state.provider';

describe('provideAuthState', () => {
  it('should be a function', () => {
    expect(typeof provideAuthState).toBe('function');
  });

  it('should return AuthStore as Provider', () => {
    const provider = provideAuthState();
    expect(provider).toBe(AuthStore);
  });

  it('should be assignable to Provider type', () => {
    const provider: Provider = provideAuthState();
    expect(provider).toBeDefined();
  });
});
