import { TestBed } from '@angular/core/testing';
import { JwtAuthApi } from '@anarchitects/auth-angular/data-access/jwt';
import { of, throwError } from 'rxjs';
import { provideAuthJwtState } from './auth-jwt-state.provider';
import { AuthJwtStore } from './auth-jwt.store';

describe('AuthJwtStore', () => {
  afterEach(() => {
    localStorage.clear();
    TestBed.resetTestingModule();
    vi.clearAllMocks();
  });

  it('refreshes tokens and stores them', async () => {
    const mockJwtAuthApi = {
      refreshTokens: vi.fn().mockReturnValue(
        of({
          accessToken: 'next-access-token',
          refreshToken: 'next-refresh-token',
        }),
      ),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: JwtAuthApi, useValue: mockJwtAuthApi },
        ...provideAuthJwtState(),
      ],
    });

    const store = TestBed.inject(AuthJwtStore);

    await store.refreshTokens({ refreshToken: 'refresh-token' });

    expect(mockJwtAuthApi.refreshTokens).toHaveBeenCalledWith({
      refreshToken: 'refresh-token',
    });
    expect(localStorage.getItem('accessToken')).toBe('next-access-token');
    expect(localStorage.getItem('refreshToken')).toBe('next-refresh-token');
    expect(store.success()).toBe(true);
    expect(store.error()).toBeNull();
  });

  it('captures refresh failures and rethrows them', async () => {
    const mockJwtAuthApi = {
      refreshTokens: vi.fn().mockReturnValue(
        throwError(() => new Error('refresh failed')),
      ),
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: JwtAuthApi, useValue: mockJwtAuthApi },
        ...provideAuthJwtState(),
      ],
    });

    const store = TestBed.inject(AuthJwtStore);

    await expect(
      store.refreshTokens({ refreshToken: 'refresh-token' }),
    ).rejects.toThrow('refresh failed');
    expect(store.success()).toBe(false);
    expect(store.error()).toBe('refresh failed');
  });
});
