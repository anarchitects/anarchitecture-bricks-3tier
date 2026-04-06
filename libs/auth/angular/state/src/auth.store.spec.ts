import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { delay, of, throwError } from 'rxjs';
import {
  AuthConfig,
  AuthContractConfigOverrides,
  provideAuthConfig,
  provideAuthContracts,
} from '@anarchitects/auth-angular/config';
import { AuthApi } from '@anarchitects/auth-angular/data-access';
import { PolicyRule, User } from '@anarchitects/auth-ts/models';
import { AuthStore } from './auth.store';
import { provideAuthState } from './auth-state.provider';
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
  contractOverrides,
}: {
  authApiOverrides?: Partial<AuthApi>;
  stateOptions?: Parameters<typeof provideAuthState>[0];
  authConfig?: Partial<AuthConfig>;
  contractOverrides?: AuthContractConfigOverrides;
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
      ...provideAuthContracts(contractOverrides),
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

  it('keeps core login session-first without writing jwt tokens to localStorage', async () => {
    const { store } = setup({
      authApiOverrides: {
        getLoggedInUserInfo: vi.fn(() =>
          throwError(() => new Error('restore failed')),
        ),
      },
    });

    await flushAsync();
    store.login({ credential: 'testuser', password: 'password' });
    await vi.advanceTimersByTimeAsync(100);

    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
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

  it('keeps core logout session-first without writing jwt tokens to localStorage', async () => {
    const { store } = setup();

    await flushAsync();
    store.logout({});
    await vi.advanceTimersByTimeAsync(100);

    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
  });

  it('strips optional register name before calling AuthApi.registerUser', async () => {
    const { store, mockAuthApi } = setup({
      stateOptions: {
        restoreOnInit: false,
      },
      contractOverrides: {
        register: {
          name: {
            emptyStringPolicy: 'strip',
          },
        },
      },
    });

    store.registerUser({
      name: '',
      email: 'jane@example.com',
      password: 'secret123',
      confirmPassword: 'secret123',
    });
    await vi.advanceTimersByTimeAsync(100);

    expect(mockAuthApi.registerUser).toHaveBeenCalledWith({
      email: 'jane@example.com',
      password: 'secret123',
      confirmPassword: 'secret123',
    });
  });

  it('rejects empty optional login password before calling AuthApi.login', async () => {
    const { store, mockAuthApi } = setup({
      stateOptions: {
        restoreOnInit: false,
      },
      contractOverrides: {
        login: {
          password: {
            required: false,
            emptyStringPolicy: 'reject',
          },
        },
      },
    });

    store.login({
      credential: 'user@example.com',
      password: '',
    });
    await flushAsync();

    expect(mockAuthApi.login).not.toHaveBeenCalled();
    expect(store.error()).toContain('password');
    expect(store.loading()).toBe(false);
    expect(store.initialized()).toBe(true);
  });

  it('allows empty optional forgot-password email through to AuthApi.forgotPassword', async () => {
    const { store, mockAuthApi } = setup({
      stateOptions: {
        restoreOnInit: false,
      },
      contractOverrides: {
        forgotPassword: {
          email: {
            required: false,
            emptyStringPolicy: 'allow',
          },
        },
      },
    });

    store.forgotPassword({
      email: '',
    });
    await vi.advanceTimersByTimeAsync(100);

    expect(mockAuthApi.forgotPassword).toHaveBeenCalledWith({
      email: '',
    });
  });

  it('strips optional reset token before calling AuthApi.resetPassword', async () => {
    const { store, mockAuthApi } = setup({
      stateOptions: {
        restoreOnInit: false,
      },
      contractOverrides: {
        resetPassword: {
          token: {
            required: false,
            emptyStringPolicy: 'strip',
          },
        },
      },
    });

    store.resetPassword({
      dto: {
        token: '',
        password: 'secret123',
        confirmPassword: 'secret123',
      },
    });
    await vi.advanceTimersByTimeAsync(100);

    expect(mockAuthApi.resetPassword).toHaveBeenCalledWith({
      password: 'secret123',
      confirmPassword: 'secret123',
    });
  });

  it('rejects empty optional verify-email token before calling AuthApi.verifyEmail', async () => {
    const { store, mockAuthApi } = setup({
      stateOptions: {
        restoreOnInit: false,
      },
      contractOverrides: {
        verifyEmail: {
          token: {
            required: false,
            emptyStringPolicy: 'reject',
          },
        },
      },
    });

    store.verifyEmail({
      token: '',
    });
    await flushAsync();

    expect(mockAuthApi.verifyEmail).not.toHaveBeenCalled();
    expect(store.error()).toContain('token');
    expect(store.loading()).toBe(false);
  });

  it('strips optional confirmPassword before calling AuthApi.changePassword', async () => {
    const { store, mockAuthApi } = setup({
      stateOptions: {
        restoreOnInit: false,
      },
      contractOverrides: {
        changePassword: {
          confirmPassword: {
            required: false,
            emptyStringPolicy: 'strip',
          },
        },
      },
    });

    store.changePassword({
      userId: 'user-id',
      dto: {
        currentPassword: 'old-password',
        newPassword: 'new-password',
        confirmPassword: '',
      },
    });
    await vi.advanceTimersByTimeAsync(100);

    expect(mockAuthApi.changePassword).toHaveBeenCalledWith('user-id', {
      currentPassword: 'old-password',
      newPassword: 'new-password',
    });
  });
});
