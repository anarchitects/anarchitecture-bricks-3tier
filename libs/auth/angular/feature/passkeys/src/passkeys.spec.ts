import { Component, provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AuthApi } from '@anarchitects/auth-angular/data-access';
import {
  PasskeyApi,
  WebAuthnClient,
} from '@anarchitects/auth-angular/data-access/passkeys';
import { AuthStore, provideAuthState } from '@anarchitects/auth-angular/state';
import { of, Subject } from 'rxjs';
import { AnarchitectsAuthPasskeys } from './passkeys';
import { provideAuthPasskeyFeature } from './passkey-feature.provider';

@Component({
  imports: [AnarchitectsAuthPasskeys],
  template:
    '<anarchitects-auth-passkeys><a passkeyFallback href="/password">Use password instead</a></anarchitects-auth-passkeys>',
})
class ProjectionHost {}

const session = {
  user: { id: 'u', email: 'user@example.test' },
  rbac: [{ action: 'read', subject: 'Post' }],
};
const credential = {
  id: 'YQ',
  rawId: 'YQ',
  type: 'public-key' as const,
  clientExtensionResults: {},
  response: { clientDataJSON: 'YQ', authenticatorData: 'YQ', signature: 'YQ' },
};
function setup() {
  const api = {
    beginRegistration: vi.fn(() => of({ challenge: 'YQ' })),
    finishRegistration: vi.fn(() => of({ success: true })),
    beginAuthentication: vi.fn(() => of({ challenge: 'YQ' })),
    finishAuthentication: vi.fn(() => of(session)),
  };
  const browser = {
    isSupported: vi.fn(() => true),
    create: vi.fn(() => of(credential)),
    get: vi.fn(() => of(credential)),
  };
  TestBed.configureTestingModule({
    providers: [
      provideZonelessChangeDetection(),
      ...provideAuthState({ restoreOnInit: false }),
      { provide: AuthApi, useValue: {} },
      ...provideAuthPasskeyFeature(),
      { provide: PasskeyApi, useValue: api },
      { provide: WebAuthnClient, useValue: browser },
    ],
  });
  return {
    api,
    browser,
    auth: TestBed.inject(AuthStore),
    fixture: TestBed.createComponent(AnarchitectsAuthPasskeys),
  };
}
describe('AnarchitectsAuthPasskeys', () => {
  afterEach(() => TestBed.resetTestingModule());
  it('projects host fallback through both layers in unsupported browsers', async () => {
    const { browser } = setup();
    browser.isSupported.mockReturnValue(false);
    const fixture = TestBed.createComponent(ProjectionHost);
    await fixture.whenStable();
    const link = fixture.nativeElement.querySelector('a');
    expect(link?.getAttribute('href')).toBe('/password');
    expect(link?.textContent).toBe('Use password instead');
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
  });
  it('starts only from a user action and hydrates the inherited session through verification', async () => {
    const { fixture, api, auth } = setup();
    await fixture.whenStable();
    expect(api.beginAuthentication).not.toHaveBeenCalled();
    fixture.nativeElement.querySelector('button').click();
    await fixture.whenStable();
    expect(api.finishAuthentication).toHaveBeenCalledWith({
      response: credential,
    });
    expect(auth.loggedInUser()).toEqual(session.user);
    expect(auth.ability()?.can('read', 'Post')).toBe(true);
    expect(
      fixture.nativeElement.querySelector('[role="status"]').textContent,
    ).toContain('completed');
  });
  it('requires a session for enrollment and forwards host options', async () => {
    const { fixture, api, auth } = setup();
    fixture.componentRef.setInput('mode', 'enroll');
    fixture.componentRef.setInput('enrollmentOptions', {
      name: 'My key',
      authenticatorAttachment: 'cross-platform',
    });
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('button').disabled).toBe(true);
    fixture.componentInstance.request();
    expect(api.beginRegistration).not.toHaveBeenCalled();
    auth.acceptSession(session);
    await fixture.whenStable();
    fixture.nativeElement.querySelector('button').click();
    expect(api.beginRegistration).toHaveBeenCalledWith({
      authenticatorAttachment: 'cross-platform',
    });
    expect(api.finishRegistration).toHaveBeenCalledWith({
      response: credential,
      name: 'My key',
    });
    expect(auth.loggedInUser()).toEqual(session.user);
  });
  it('cancels pending work and preserves host disabling', async () => {
    const { fixture, api, browser } = setup();
    const pending = new Subject<typeof credential>();
    browser.get.mockReturnValue(pending);
    await fixture.whenStable();
    fixture.nativeElement.querySelector('button').click();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('button').disabled).toBe(true);
    fixture.nativeElement.querySelectorAll('button')[1].click();
    await fixture.whenStable();
    expect(pending.observed).toBe(false);
    expect(api.finishAuthentication).not.toHaveBeenCalled();
    expect(
      fixture.nativeElement.querySelector('[role="status"]').textContent,
    ).toContain('cancelled');
    fixture.componentRef.setInput('disabled', true);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('button').disabled).toBe(true);
  });
});
