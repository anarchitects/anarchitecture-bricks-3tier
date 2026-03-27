import {
  HttpContext,
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { Router } from '@angular/router';
import { provideAuthConfig } from '@anarchitects/auth-angular/config';
import { authBearerTokenInterceptor } from './bearer-token.interceptor';
import {
  authErrorInterceptor,
  SUPPRESS_AUTH_FAILURE_REDIRECT,
} from './auth-error.interceptor';

const decodableAccessToken =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyLTEyMyJ9.signature';

describe('authErrorInterceptor', () => {
  let http: HttpClient;
  let httpController: HttpTestingController;
  const mockRouter = {
    navigateByUrl: vi.fn().mockResolvedValue(true),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        ...provideAuthConfig({
          plugins: {
            jwt: {
              enabled: true,
            },
          },
        }),
        provideHttpClient(
          withInterceptors([authBearerTokenInterceptor, authErrorInterceptor])
        ),
        provideHttpClientTesting(),
        { provide: Router, useValue: mockRouter },
      ],
    });

    http = TestBed.inject(HttpClient);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    httpController.verify();
    TestBed.resetTestingModule();
  });

  it('should refresh tokens and retry request on 403', () => {
    localStorage.setItem('accessToken', decodableAccessToken);
    localStorage.setItem('refreshToken', 'refresh-token');

    const responseSpy = vi.fn();

    http.get('/api/protected').subscribe(responseSpy);

    const initialReq = httpController.expectOne('/api/protected');
    expect(initialReq.request.headers.get('Authorization')).toBe(
      `Bearer ${decodableAccessToken}`
    );
    initialReq.flush(
      { message: 'forbidden' },
      { status: 403, statusText: 'Forbidden' }
    );

    const refreshReq = httpController.expectOne('/api/auth/jwt/refresh');
    expect(refreshReq.request.method).toBe('POST');
    expect(refreshReq.request.body).toEqual({ refreshToken: 'refresh-token' });
    refreshReq.flush({
      accessToken: 'new-access-token',
      refreshToken: 'new-refresh-token',
    });

    const retryReq = httpController.expectOne('/api/protected');
    expect(retryReq.request.headers.get('Authorization')).toBe(
      'Bearer new-access-token'
    );
    retryReq.flush({ ok: true });

    expect(responseSpy).toHaveBeenCalledWith({ ok: true });
    expect(localStorage.getItem('accessToken')).toBe('new-access-token');
    expect(localStorage.getItem('refreshToken')).toBe('new-refresh-token');
    expect(mockRouter.navigateByUrl).not.toHaveBeenCalled();
  });

  it('should redirect to login when refresh token is missing', () => {
    localStorage.setItem('accessToken', decodableAccessToken);

    const errorSpy = vi.fn();

    http.get('/api/protected').subscribe({ error: errorSpy });

    const initialReq = httpController.expectOne('/api/protected');
    initialReq.flush(
      { message: 'unauthorized' },
      { status: 401, statusText: 'Unauthorized' }
    );

    expect(
      httpController.match((req) => req.url.includes('/jwt/refresh'))
    ).toHaveLength(0);
    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/login');
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(errorSpy).toHaveBeenCalled();
  });

  it('should redirect to login when refresh request fails', () => {
    localStorage.setItem('accessToken', decodableAccessToken);
    localStorage.setItem('refreshToken', 'refresh-token');

    const errorSpy = vi.fn();

    http.get('/api/protected').subscribe({ error: errorSpy });

    const initialReq = httpController.expectOne('/api/protected');
    initialReq.flush(
      { message: 'unauthorized' },
      { status: 401, statusText: 'Unauthorized' }
    );

    const refreshReq = httpController.expectOne('/api/auth/jwt/refresh');
    refreshReq.flush(
      { message: 'refresh denied' },
      { status: 401, statusText: 'Unauthorized' }
    );

    expect(mockRouter.navigateByUrl).toHaveBeenCalledWith('/login');
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(errorSpy).toHaveBeenCalled();
  });

  it('should not attempt refresh for public login endpoint failures', () => {
    localStorage.setItem('accessToken', decodableAccessToken);
    localStorage.setItem('refreshToken', 'refresh-token');

    const errorSpy = vi.fn();

    http.post('/api/auth/login', { credential: 'u', password: 'p' }).subscribe({
      error: errorSpy,
    });

    const loginReq = httpController.expectOne('/api/auth/login');
    loginReq.flush(
      { message: 'invalid credentials' },
      { status: 401, statusText: 'Unauthorized' }
    );

    expect(
      httpController.match((req) => req.url.includes('/jwt/refresh'))
    ).toHaveLength(0);
    expect(mockRouter.navigateByUrl).not.toHaveBeenCalled();
    expect(errorSpy).toHaveBeenCalled();
  });

  it('should suppress redirect when the request opts out during startup restore', () => {
    localStorage.setItem('accessToken', decodableAccessToken);
    localStorage.setItem('refreshToken', 'refresh-token');

    const errorSpy = vi.fn();

    http
      .get('/api/protected', {
        context: new HttpContext().set(SUPPRESS_AUTH_FAILURE_REDIRECT, true),
      })
      .subscribe({ error: errorSpy });

    const initialReq = httpController.expectOne('/api/protected');
    initialReq.flush(
      { message: 'unauthorized' },
      { status: 401, statusText: 'Unauthorized' }
    );

    const refreshReq = httpController.expectOne('/api/auth/jwt/refresh');
    refreshReq.flush(
      { message: 'refresh denied' },
      { status: 401, statusText: 'Unauthorized' }
    );

    expect(mockRouter.navigateByUrl).not.toHaveBeenCalled();
    expect(localStorage.getItem('accessToken')).toBeNull();
    expect(localStorage.getItem('refreshToken')).toBeNull();
    expect(errorSpy).toHaveBeenCalled();
  });
});
