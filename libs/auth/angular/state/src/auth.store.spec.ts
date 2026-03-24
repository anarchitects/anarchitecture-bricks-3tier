import { TestBed } from '@angular/core/testing';
import { delay, of } from 'rxjs';
import { AuthApi } from '../../data-access/src';
import { AuthStore } from './auth.store';
import { provideAuthState } from './auth-state.provider';

const validAccessToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWlkIiwiZW1haWwiOiJ1c2VyQGV4YW1wbGUuY29tIn0.signature';
const validRefreshToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLWlkIn0.signature';

const setup = () => {
  const mockAuthApi = {
    registerUser: vi.fn(() => of({ success: true }).pipe(delay(100))),
    activateUser: vi.fn(() => of({ success: true }).pipe(delay(100))),
    login: vi.fn(() =>
      of({
        accessToken: validAccessToken,
        refreshToken: validRefreshToken,
      }).pipe(delay(100)),
    ),
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
    getLoggedInUserInfo: vi.fn(() =>
      of({
        user: { id: 'user-id', email: 'user@example.com' },
        rbac: [],
      }),
    ),
  };
  TestBed.configureTestingModule({
    providers: [
      { provide: AuthApi, useValue: mockAuthApi },
      provideAuthState(),
    ],
  });

  return TestBed.inject(AuthStore);
};

describe('AuthStore', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    localStorage.clear();
    vi.useRealTimers();
    vi.clearAllMocks();
  });

  it('should create an instance', () => {
    expect(setup()).toBeTruthy();
  });
  describe('registerUser', () => {
    it('should call registerUser API and update state', async () => {
      const store = setup();
      store.registerUser({
        email: 'test@example.com',
        password: 'password',
        confirmPassword: 'password',
      });
      expect(store.loading()).toBe(true);
      expect(store.error()).toBeNull();
      await vi.advanceTimersByTimeAsync(100);
      expect(store.loading()).toBe(false);
      expect(store.error()).toBeNull();
      expect(store.success()).toBe(true);
    });
  });
  describe('activateUser', () => {
    it('should call activateUser API and update state', async () => {
      const store = setup();
      store.activateUser({ token: 'activation-token' });
      expect(store.loading()).toBe(true);
      expect(store.error()).toBeNull();
      await vi.advanceTimersByTimeAsync(100);
      expect(store.loading()).toBe(false);
      expect(store.error()).toBeNull();
      expect(store.success()).toBe(true);
    });
  });
  describe('login', () => {
    it('should call login API and update state', async () => {
      const store = setup();
      store.login({ credential: 'testuser', password: 'password' });
      expect(store.loading()).toBe(true);
      expect(store.error()).toBeNull();
      await vi.advanceTimersByTimeAsync(100);
      expect(store.loading()).toBe(false);
      expect(store.error()).toBeNull();
      expect(store.isLoggedIn()).toBe(true);
      expect(store.loggedInUser()).toBeDefined();
    });
  });
  describe('logout', () => {
    it('should call logout API and update state', async () => {
      const store = setup();
      store.logout({
        accessToken: validAccessToken,
        refreshToken: validRefreshToken,
      });
      expect(store.loading()).toBe(true);
      expect(store.error()).toBeNull();
      await vi.advanceTimersByTimeAsync(100);
      expect(store.loading()).toBe(false);
      expect(store.error()).toBeNull();
      expect(store.isLoggedIn()).toBe(false);
      expect(store.loggedInUser()).toBeUndefined();
    });
  });
  describe('refreshTokens', () => {
    it('should call refreshTokens API and update state', async () => {
      const store = setup();
      store.refreshTokens({
        userId: 'user-id',
        dto: { refreshToken: validRefreshToken },
      });
      expect(store.loading()).toBe(true);
      expect(store.error()).toBeNull();
      await vi.advanceTimersByTimeAsync(100);
      expect(store.loading()).toBe(false);
      expect(store.error()).toBeNull();
      expect(store.isLoggedIn()).toBe(true);
      expect(store.loggedInUser()).toBeDefined();
    });
  });
  describe('changePassword', () => {
    it('should call changePassword API and update state', async () => {
      const store = setup();
      store.changePassword({
        userId: 'user-id',
        dto: {
          currentPassword: 'old-password',
          newPassword: 'new-password',
          confirmPassword: 'new-password',
        },
      });
      expect(store.loading()).toBe(true);
      expect(store.error()).toBeNull();
      await vi.advanceTimersByTimeAsync(100);
      expect(store.loading()).toBe(false);
      expect(store.error()).toBeNull();
      expect(store.success()).toBe(true);
    });
  });
  describe('forgotPassword', () => {
    it('should call forgotPassword API and update state', async () => {
      const store = setup();
      store.forgotPassword({ email: 'test@example.com' });
      expect(store.loading()).toBe(true);
      expect(store.error()).toBeNull();
      await vi.advanceTimersByTimeAsync(100);
      expect(store.loading()).toBe(false);
      expect(store.error()).toBeNull();
      expect(store.success()).toBe(true);
    });
  });
  describe('resetPassword', () => {
    it('should call resetPassword API and update state', async () => {
      const store = setup();
      store.resetPassword({
        dto: {
          token: 'reset-token',
          password: 'new-password',
          confirmPassword: 'new-password',
        },
      });
      expect(store.loading()).toBe(true);
      expect(store.error()).toBeNull();
      await vi.advanceTimersByTimeAsync(100);
      expect(store.loading()).toBe(false);
      expect(store.error()).toBeNull();
      expect(store.success()).toBe(true);
    });
  });
  describe('updateEmail', () => {
    it('should call updateEmail API and update state', async () => {
      const store = setup();
      store.updateEmail({
        userId: 'user-id',
        dto: { newEmail: 'new-email@example.com', password: 'password' },
      });
      expect(store.loading()).toBe(true);
      expect(store.error()).toBeNull();
      await vi.advanceTimersByTimeAsync(100);
      expect(store.loading()).toBe(false);
      expect(store.error()).toBeNull();
      expect(store.success()).toBe(true);
    });
  });
  describe('verifyEmail', () => {
    it('should call verifyEmail API and update state', async () => {
      const store = setup();
      store.verifyEmail({ token: 'verification-token' });
      expect(store.loading()).toBe(true);
      expect(store.error()).toBeNull();
      await vi.advanceTimersByTimeAsync(100);
      expect(store.loading()).toBe(false);
      expect(store.error()).toBeNull();
      expect(store.success()).toBe(true);
    });
  });
});
