import { createEnvironmentInjector, EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthApi } from '@anarchitects/auth-angular/data-access';
import {
  PasskeyApi,
  PasskeyBrowserError,
  WebAuthnClient,
} from '@anarchitects/auth-angular/data-access/passkeys';
import { AuthStore, provideAuthState } from '@anarchitects/auth-angular/state';
import { Observable, of, Subject, throwError } from 'rxjs';
import { AuthPasskeyStore } from './auth-passkey.store';
import { provideAuthPasskeyState } from './auth-passkey-state.provider';

const session = {
  user: { id: 'u', email: 'u@example.com' },
  rbac: [{ action: 'read', subject: 'Post' }],
};
const response = {
  id: 'YQ',
  rawId: 'YQ',
  type: 'public-key' as const,
  clientExtensionResults: {},
  response: { clientDataJSON: 'YQ', authenticatorData: 'YQ', signature: 'YQ' },
};
const registration = {
  ...response,
  response: { clientDataJSON: 'YQ', attestationObject: 'YQ' },
};

function setup(restore?: Subject<typeof session>) {
  const api = {
    beginRegistration: vi.fn(() => of({ challenge: 'YQ' })),
    finishRegistration: vi.fn(() => of({ success: true })),
    beginAuthentication: vi.fn(() => of({ challenge: 'YQ' })),
    finishAuthentication: vi.fn(() => of(session)),
  };
  const browser = {
    isSupported: vi.fn(() => true),
    create: vi.fn<() => Observable<typeof registration>>(() =>
      of(registration),
    ),
    get: vi.fn<() => Observable<typeof response>>(() => of(response)),
  };
  TestBed.configureTestingModule({
    providers: [
      ...provideAuthState({ restoreOnInit: !!restore }),
      { provide: AuthApi, useValue: { getLoggedInUserInfo: () => restore } },
      ...provideAuthPasskeyState(),
      { provide: PasskeyApi, useValue: api },
      { provide: WebAuthnClient, useValue: browser },
    ],
  });
  return {
    api,
    browser,
    auth: TestBed.inject(AuthStore),
    store: TestBed.inject(AuthPasskeyStore),
  };
}

describe('AuthPasskeyStore', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('hydrates the existing auth session and ability after verified sign-in', () => {
    const { store, auth, api, browser } = setup();
    const handle = store.signIn();
    expect(handle).not.toHaveProperty('then');
    expect(browser.get).toHaveBeenCalledWith({ challenge: 'YQ' });
    expect(api.finishAuthentication).toHaveBeenCalledWith({ response });
    expect(auth.loggedInUser()).toEqual(session.user);
    expect(auth.ability()?.can('read', 'Post')).toBe(true);
    expect(store.success()).toBe(true);
    expect(store.loading()).toBe(false);
  });

  it('enrolls without replacing the existing session', () => {
    const { store, auth, api } = setup();
    auth.acceptSession(session);
    store.enroll({ name: 'Laptop', authenticatorAttachment: 'platform' });
    expect(api.beginRegistration).toHaveBeenCalledWith({
      authenticatorAttachment: 'platform',
    });
    expect(api.finishRegistration).toHaveBeenCalledWith({
      response: registration,
      name: 'Laptop',
    });
    expect(auth.loggedInUser()).toEqual(session.user);
    expect(store.success()).toBe(true);
  });

  it('ignores duplicate and competing ceremonies until the active one completes', () => {
    const { store, api, browser } = setup();
    const pending = new Subject<typeof response>();
    browser.get.mockReturnValue(pending);
    store.signIn();
    store.signIn();
    store.enroll({});
    expect(store.loading()).toBe(true);
    expect(api.beginAuthentication).toHaveBeenCalledOnce();
    expect(api.beginRegistration).not.toHaveBeenCalled();
    pending.next(response);
    pending.complete();
    store.enroll({});
    expect(api.beginRegistration).toHaveBeenCalledOnce();
    expect(store.loading()).toBe(false);
  });

  it('cancels active browser work, ignores late results, and allows retry', () => {
    const { store, api, browser } = setup();
    const pending = new Subject<typeof response>();
    browser.get.mockReturnValue(pending);
    store.signIn();
    store.cancel();
    expect(pending.observed).toBe(false);
    expect(store.cancelled()).toBe(true);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
    pending.next(response);
    expect(api.finishAuthentication).not.toHaveBeenCalled();
    browser.get.mockReturnValue(of(response));
    store.signIn();
    expect(store.success()).toBe(true);
    expect(store.cancelled()).toBe(false);
  });

  it('reports cancellation separately and keeps the reactive method usable after errors', () => {
    const { store, browser, auth } = setup();
    browser.get
      .mockReturnValueOnce(
        throwError(() => new PasskeyBrowserError('cancelled', 'Timed out')),
      )
      .mockReturnValueOnce(throwError(() => new Error('Failed')));
    store.signIn();
    expect(store.cancelled()).toBe(true);
    expect(store.error()).toBeNull();
    expect(auth.isLoggedIn()).toBe(false);
    store.signIn();
    expect(store.error()).toBe('Failed');
    expect(store.cancelled()).toBe(false);
    store.signIn();
    expect(store.success()).toBe(true);
    expect(store.error()).toBeNull();
  });

  it('does not start a server challenge in unsupported environments', () => {
    const { store, api, browser } = setup();
    browser.isSupported.mockReturnValue(false);
    store.signIn();
    expect(api.beginAuthentication).not.toHaveBeenCalled();
    expect(store.error()).toContain('not supported');
    expect(store.loading()).toBe(false);
  });

  it.each(['success', 'failure'])(
    'ignores a stale startup restore %s after passkey sign-in',
    (outcome) => {
      const restore = new Subject<typeof session>();
      const { store, auth } = setup(restore);
      expect(auth.restoring()).toBe(true);
      store.signIn();
      if (outcome === 'success')
        restore.next({
          user: { id: 'old', email: 'old@example.com' },
          rbac: [],
        });
      else restore.error(new Error('Old anonymous request'));
      expect(auth.loggedInUser()).toEqual(session.user);
      expect(auth.restoring()).toBe(false);
      expect(auth.error()).toBeNull();
    },
  );

  it('isolates feature state and tears down the browser subscription with its scope', () => {
    const { auth, api, browser } = setup();
    const parent = TestBed.inject(EnvironmentInjector);
    const providers = [
      ...provideAuthPasskeyState(),
      { provide: PasskeyApi, useValue: api },
      { provide: WebAuthnClient, useValue: browser },
    ];
    const first = createEnvironmentInjector(providers, parent);
    const second = createEnvironmentInjector(providers, parent);
    const pending = new Subject<typeof response>();
    browser.get.mockReturnValue(pending);
    first.get(AuthPasskeyStore).signIn();
    expect(first.get(AuthPasskeyStore).loading()).toBe(true);
    expect(second.get(AuthPasskeyStore).loading()).toBe(false);
    expect(first.get(AuthStore)).toBe(auth);
    first.destroy();
    expect(pending.observed).toBe(false);
    pending.next(response);
    expect(api.finishAuthentication).not.toHaveBeenCalled();
    second.destroy();
  });
});
