import { Provider } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideIdentityConfig } from '@anarchitects/identity-angular/config';
import { provideIdentityDataAccess } from '@anarchitects/identity-angular/data-access';
import { provideIdentityState } from './identity-state.provider';
import { IdentityStore } from './identity.store';

describe('provideIdentityState', () => {
  afterEach(() => {
    TestBed.resetTestingModule();
  });

  it('should return IdentityStore as a provider', () => {
    const providers = provideIdentityState();

    expect(providers).toContain(IdentityStore);
    expect(providers as Provider[]).toBeDefined();
  });

  it('should keep state explicitly scoped through providers', () => {
    TestBed.configureTestingModule({
      providers: [
        ...provideIdentityConfig({ apiResourcePath: 'profiles' }),
        ...provideIdentityDataAccess(),
        ...provideIdentityState(),
      ],
    });

    const store = TestBed.inject(IdentityStore);

    expect(store.resourcePath()).toBe('profiles');
  });
});
