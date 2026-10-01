import { Component, effect, inject, signal, untracked } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { provideAuthConfig } from '@anarchitects/auth-angular/config';
import { AuthApi } from '@anarchitects/auth-angular/data-access';
import { LoginRequestDTO } from '@anarchitects/auth-ts/dtos';
import { AuthUser, PolicyRule } from '@anarchitects/auth-ts/models';
import { Observable, Subject, of, throwError } from 'rxjs';
import { AuthStore } from './auth.store';
import { provideAuthState } from './auth-state.provider';

// Consumer fixture for the state README's host-owned redirect recipe.
@Component({ template: '' })
class LoginPage {
  readonly store = inject(AuthStore);
  private readonly router = inject(Router);
  private readonly loginPending = signal(false);

  constructor() {
    effect(() => {
      if (
        !this.loginPending() ||
        this.store.loading() ||
        this.store.restoring()
      ) {
        return;
      }

      const authenticated =
        this.store.success() &&
        this.store.error() === null &&
        this.store.isLoggedIn();
      untracked(() => {
        this.loginPending.set(false);
        if (authenticated) {
          void this.router.navigateByUrl('/admin/dashboard');
        }
      });
    });
  }

  onLogin(dto: LoginRequestDTO): void {
    if (
      !this.store.initialized() ||
      this.store.restoring() ||
      this.store.loading() ||
      this.loginPending()
    ) {
      return;
    }

    this.loginPending.set(true);
    this.store.login(dto);
  }
}

type Session = { user: AuthUser; rbac: PolicyRule[] };
const session: Session = {
  user: {
    id: 'user-id',
    email: 'user@example.com',
    name: 'User',
    emailVerified: true,
    roles: null,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
  },
  rbac: [{ action: 'read', subject: 'Post' }],
};
const dto: LoginRequestDTO = {
  credential: 'user@example.com',
  password: 'secret',
};

function setup(restore?: Observable<Session>) {
  const response = new Subject<Session>();
  const api = {
    login: vi.fn<() => Observable<Session>>(() => response),
    getLoggedInUserInfo: vi.fn(
      () => restore ?? throwError(() => new Error('No session')),
    ),
  };
  const router = { navigateByUrl: vi.fn().mockResolvedValue(true) };
  TestBed.configureTestingModule({
    imports: [LoginPage],
    providers: [
      { provide: AuthApi, useValue: api },
      { provide: Router, useValue: router },
      ...provideAuthConfig({}),
      ...provideAuthState(),
    ],
  });
  const fixture = TestBed.createComponent(LoginPage);
  fixture.autoDetectChanges();
  return { fixture, page: fixture.componentInstance, response, api, router };
}

describe('Reactive login redirect recipe', () => {
  afterEach(() => TestBed.resetTestingModule());

  it('redirects once on the first successful submission with hydrated session state', async () => {
    const { fixture, page, response, router } = setup();
    await fixture.whenStable();
    page.onLogin(dto);
    await fixture.whenStable();
    expect(router.navigateByUrl).not.toHaveBeenCalled();

    response.next(session);
    response.complete();
    await fixture.whenStable();

    expect(router.navigateByUrl).toHaveBeenCalledExactlyOnceWith(
      '/admin/dashboard',
    );
    expect(page.store.loggedInUser()?.id).toBe(session.user.id);
    expect(page.store.rbac()).toEqual(session.rbac);
    expect(page.store.ability()?.can('read', 'Post')).toBe(true);
    await fixture.whenStable();
    expect(router.navigateByUrl).toHaveBeenCalledTimes(1);
  });

  it('does not redirect for a restored session without a submission', async () => {
    const { fixture, page, router } = setup(of(session));
    await fixture.whenStable();
    expect(page.store.isLoggedIn()).toBe(true);
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('waits for bootstrap restoration before accepting login', async () => {
    const restore = new Subject<Session>();
    const { fixture, page, api, router } = setup(restore);
    page.onLogin(dto);
    restore.next(session);
    restore.complete();
    await fixture.whenStable();
    expect(api.login).not.toHaveBeenCalled();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });

  it('does not redirect on a failed login even with an existing session, and permits retry', async () => {
    const { fixture, page, response, api, router } = setup(of(session));
    await fixture.whenStable();
    page.onLogin(dto);
    response.error(new Error('Invalid credentials'));
    await fixture.whenStable();
    expect(page.store.error()).toBe('Invalid credentials');
    expect(router.navigateByUrl).not.toHaveBeenCalled();

    const retry = new Subject<Session>();
    api.login.mockReturnValueOnce(retry);
    page.onLogin(dto);
    retry.next(session);
    retry.complete();
    await fixture.whenStable();
    expect(router.navigateByUrl).toHaveBeenCalledExactlyOnceWith(
      '/admin/dashboard',
    );
  });

  it('handles a synchronous login response and ignores duplicate submits before the effect runs', async () => {
    const { fixture, page, api, router } = setup();
    await fixture.whenStable();
    api.login.mockReturnValueOnce(of(session));
    page.onLogin(dto);
    page.onLogin(dto);
    await fixture.whenStable();
    expect(api.login).toHaveBeenCalledTimes(1);
    expect(router.navigateByUrl).toHaveBeenCalledTimes(1);
  });

  it('stops the redirect effect when the login page is destroyed', async () => {
    const { fixture, page, response, router } = setup();
    await fixture.whenStable();
    page.onLogin(dto);
    fixture.destroy();
    response.next(session);
    response.complete();
    await fixture.whenStable();
    expect(router.navigateByUrl).not.toHaveBeenCalled();
  });
});
