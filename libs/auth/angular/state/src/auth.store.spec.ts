import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { delay, of, throwError } from 'rxjs';
import {
  AuthConfig,
  provideAuthConfig,
} from '@anarchitects/auth-angular/config';
import { AuthApi } from '../../data-access/src';
import { PolicyRule, User } from '@anarchitects/auth-ts/models';
import { AuthStore } from './auth.store';
import { provideAuthState } from './auth-state.provider';

const validAccessToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWlkIiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIn0.signature';
const validRefreshToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWlkIn0.signature';
const hydratedSession: { user: User; rbac: PolicyRule[] } = {
  user: {
    id: 'user-id',
    email: 'user@example.com',
    name: 'user',
    emailVerified: true,
    roles: null,
    createdAt: new Date('2024-01-01T00:00:00.000Z'),
    updatedAt: new Date('2024-01-01T00:00:00.000Z'),
  },
  rbac: [
    {
      action: 'update',
      subject: 'Post',
      conditions: { authorId: 'user-id' },
    },
  ],
};

const createMockAuthApi = (overrides: Partial<AuthApi> = {}) => ({
  registerUser: vi.fn(() => of({ success: true }).pipe(delay(100))),
  activateUser: vi.fn(() => of({ success: true }).pipe(delay(100))),
  login: vi.fn(() => of(hydratedSession).pipe(delay(100))),
  logout: vi.fn(() => of({ success: true }).pipe(delay(100))),
  changePassword: vi.fn(() => of({ success: true }).pipe(delay(100))),
  forgotPassword: vi.fn(() => of({ success: true }).pipe(delay(100))),
  resetPassword: vi.fn(() => of({ success: true }).pipe(delay(100))),
  updateEmail: vi.fn(() => of({ success: true }).pipe(delay(100))),
  verifyEmail: vi.fn(() => of({ success: true }).pipe(delay(100))),
  refreshTokens: vi.fn(() =>
    of({
      accessToken: validAccessToken,
      refreshToken: validRefreshToken,
    }).pipe(delay(100)),
  ),
  getLoggedInUserInfo: vi.fn(() => of(hydratedSession)),
  ...overrides,
});

const flushAsync = async () => {
  await vi.advanceTimersByTimeAsync(0);
  await Promise.resolve();
};

const setup = ({
  authApiOverrides,
  stateOptions,
  authConfig,
}: {
  authApiOverrides?: Partial<AuthApi>;
  stateOptions?: Parameters<typeof provideAuthState>[0];
  authConfig?: Partial<AuthConfig>;
} = {}) => {
  const mockAuthApi = createMockAuthApi(authApiOverrides);
  const mockRouter = {
    navigateByUrl: vi.fn().mockResolvedValue(true),
  };

  TestBed.configureTestingModule({
    providers: [
      { provide: AuthApi, useValue: mockAuthApi },
      { provide: Router, useValue: mockRouter },
      ...provideAuthConfig(authConfig ?? {}),
      ...provideAuthState(stateOptions),
    ],
  });

  return {
    mockAuthApi,
    mockRouter,
    store: TestBed.inject(AuthStore),
  };
};

describe('AuthStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('creates an instance and restores the session on init by default', async () => {
    const { store, mockAuthApi } = setup();

    await flushAsync();

    expect(store).toBeTruthy();
    expect(mockAuthApi.getLoggedInUserInfo).toHaveBeenCalledWith({
      suppressAuthFailureRedirect: true,
    });
    expect(store.initialized()).toBe(true);
    expect(store.restoring()).toBe(false);
    expect(store.isLoggedIn()).toBe(true);
    expect(store.loggedInUser()).toEqual({
      email: hydratedSession.user.email,
      id: hydratedSession.user.id,
    });
  });

  it('clears session state and stays logged out on restore failure by default', async () => {
    const { store, mockRouter } = setup({
      authApiOverrides: {
        getLoggedInUserInfo: vi.fn(() =>
          throwError(() => new Error('restore failed')),
        ),
      },
    });

    await flushAsync();

    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(store.initialized()).toBe(true);
    expect(store.isLoggedIn()).toBe(false);
    expect(mockRouter.navigateByUrl).not.toHaveBeenCalled();
  });

  it('redirects to /login on restore failure when configured', async () => {
    const { mockRouter } = setup({
      authApiOverrides: {
        getLoggedInUserInfo: vi.fn(() =>
          throwError(() => new Error('restore failed')),
        ),
      },
      stateOptions: {
        onRestoreFailure: 'redirectToLogin',
      },
    });

    await flushAsync();

    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('can disable restore on init explicitly', async () => {
    const { store, mockAuthApi } = setup({
      stateOptions: {
        restoreOnInit: false,
      },
    });

    await flushAsync();

    expect(mockAuthApi.getLoggedInUserInfo).not.toHaveBeenCalled();
    expect(store.initialized()).toBe(true);
    expect(store.isLoggedIn()).toBe(false);
  });

  it('hydrates raw rbac and ability on login', async () => {
    const { store } = setup({
      authApiOverrides: {
        getLoggedInUserInfo: vi.fn(() =>
          throwError(() => new Error('restore failed')),
        ),
      },
    });

    await flushAsync();
    store.login({ credential: 'testuser', password: 'password' });

    expect(store.loading()).toBe(true);
    await vi.advanceTimersByTimeAsync(100);

    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.isLoggedIn()).toBe(true);
    expect(store.rbac()).toEqual(hydratedSession.rbac);
    expect(store.ability()?.can('update', 'Post')).toBe(true);
  });

  it('clears user, rbac, and ability on core session logout', async () => {
    const { store } = setup();

    await flushAsync();
    store.logout({});

    expect(store.loading()).toBe(true);
    await vi.advanceTimersByTimeAsync(100);

    expect(store.loading()).toBe(false);
    expect(store.isLoggedIn()).toBe(false);
    expect(store.loggedInUser()).toBeUndefined();
    expect(store.rbac()).toEqual([]);
    expect(store.ability()).toBeUndefined();
  });

  it('stores refreshed JWT tokens when the JWT plugin is enabled', async () => {
    const { store } = setup({
      authApiOverrides: {
        getLoggedInUserInfo: vi.fn(() =>
          throwError(() => new Error('restore failed')),
        ),
      },
      authConfig: {
        plugins: {
          jwt: {
            enabled: true,
          },
        },
      },
    });

    await flushAsync();
    store.refreshTokens({ refreshToken: validRefreshToken });

    expect(store.loading()).toBe(true);
    await vi.advanceTimersByTimeAsync(100);

    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.initialized()).toBe(true);
    expect(localStorage.getItem('accessToken')).toBe(validAccessToken);
    expect(localStorage.getItem('refreshToken')).toBe(validRefreshToken);
  });

  it('fails fast when refreshTokens is called while the JWT plugin is disabled', async () => {
    const { store } = setup({
      authApiOverrides: {
        getLoggedInUserInfo: vi.fn(() =>
          throwError(() => new Error('restore failed')),
        ),
      },
    });

    await flushAsync();
    store.refreshTokens({ refreshToken: validRefreshToken });
    await flushAsync();

    expect(store.loading()).toBe(false);
    expect(store.error()).toBe('JWT plugin is disabled.');
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });
});
