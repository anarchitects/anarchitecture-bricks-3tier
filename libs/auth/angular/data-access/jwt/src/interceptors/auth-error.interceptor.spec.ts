import {
  HttpBackend,
  HttpContext,
  HttpErrorResponse,
  HttpRequest,
  HttpResponse,
} from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import {
  provideAuthConfig,
  SUPPRESS_AUTH_FAILURE_REDIRECT,
} from '@anarchitects/auth-angular/config';
import { Router } from '@angular/router';
import { lastValueFrom, of, throwError } from 'rxjs';
import { authErrorInterceptor } from './auth-error.interceptor';

describe('authErrorInterceptor', () => {
  const navigateByUrl = vi.fn(() => Promise.resolve(true));
  let backendHandle: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    localStorage.clear();
    backendHandle = vi.fn();
    TestBed.configureTestingModule({
      providers: [
        provideAuthConfig({}),
        {
          provide: Router,
          useValue: { navigateByUrl },
        },
        {
          provide: HttpBackend,
          useValue: {
            handle: backendHandle,
          },
        },
      ],
    });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('refreshes tokens and retries the request on unauthorized responses', async () => {
    localStorage.setItem('refreshToken', 'refresh-token');
    backendHandle.mockReturnValue(
      of(
        new HttpResponse({
          status: 200,
          body: {
            accessToken: 'next-access-token',
            refreshToken: 'next-refresh-token',
          },
        })
      )
    );

    const req = new HttpRequest('GET', '/api/auth/me');
    const next = vi
      .fn()
      .mockReturnValueOnce(
        throwError(
          () =>
            new HttpErrorResponse({
              status: 401,
              statusText: 'Unauthorized',
              url: '/api/auth/me',
            })
        )
      )
      .mockImplementation((request: HttpRequest<unknown>) =>
        of(new HttpResponse({ status: 200, body: request }))
      );

    const response = (await TestBed.runInInjectionContext(() =>
      lastValueFrom(authErrorInterceptor(req, next))
    )) as HttpResponse<unknown>;

    expect(backendHandle).toHaveBeenCalledTimes(1);
    const refreshRequest = backendHandle.mock.calls[0][0] as HttpRequest<unknown>;
    expect(refreshRequest.url).toBe('/api/auth/jwt/refresh');
    expect(refreshRequest.method).toBe('POST');
    expect(refreshRequest.body).toEqual({
      refreshToken: 'refresh-token',
    });
    const forwarded = response.body as HttpRequest<unknown>;
    expect(forwarded.headers.get('Authorization')).toBe(
      'Bearer next-access-token'
    );
    expect(localStorage.getItem('accessToken')).toBe('next-access-token');
    expect(localStorage.getItem('refreshToken')).toBe('next-refresh-token');
  });

  it('clears tokens and redirects when refresh token is missing', async () => {
    localStorage.setItem('accessToken', 'stale-access');

    const req = new HttpRequest('GET', '/api/auth/me');
    const next = vi.fn().mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            statusText: 'Unauthorized',
            url: '/api/auth/me',
          })
      )
    );

    await expect(
      TestBed.runInInjectionContext(() =>
        lastValueFrom(authErrorInterceptor(req, next))
      )
    ).rejects.toBeInstanceOf(HttpErrorResponse);

    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(navigateByUrl).toHaveBeenCalledWith('/login');
  });

  it('skips redirect when the request suppresses auth failure redirects', async () => {
    const req = new HttpRequest('GET', '/api/auth/me', undefined, {
      context: new HttpContext().set(SUPPRESS_AUTH_FAILURE_REDIRECT, true),
    });
    const next = vi.fn().mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            statusText: 'Unauthorized',
            url: '/api/auth/me',
          })
      )
    );

    await expect(
      TestBed.runInInjectionContext(() =>
        lastValueFrom(authErrorInterceptor(req, next))
      )
    ).rejects.toBeInstanceOf(HttpErrorResponse);

    expect(navigateByUrl).not.toHaveBeenCalled();
  });

  it('does not refresh for public auth endpoints', async () => {
    localStorage.setItem('refreshToken', 'refresh-token');

    const req = new HttpRequest('POST', '/api/auth/login', null);
    const next = vi.fn().mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            statusText: 'Unauthorized',
            url: '/api/auth/login',
          })
      )
    );

    await expect(
      TestBed.runInInjectionContext(() =>
        lastValueFrom(authErrorInterceptor(req, next))
      )
    ).rejects.toBeInstanceOf(HttpErrorResponse);

    expect(backendHandle).not.toHaveBeenCalled();
  });

  it('does not refresh for refresh endpoint failures', async () => {
    localStorage.setItem('refreshToken', 'refresh-token');

    const req = new HttpRequest('POST', '/api/auth/jwt/refresh', null);
    const next = vi.fn().mockReturnValue(
      throwError(
        () =>
          new HttpErrorResponse({
            status: 401,
            statusText: 'Unauthorized',
            url: '/api/auth/jwt/refresh',
          })
      )
    );

    await expect(
      TestBed.runInInjectionContext(() =>
        lastValueFrom(authErrorInterceptor(req, next))
      )
    ).rejects.toBeInstanceOf(HttpErrorResponse);

    expect(backendHandle).not.toHaveBeenCalled();
  });
});
