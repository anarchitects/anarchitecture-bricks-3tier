import { HttpHeaders, HttpRequest, HttpResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideAuthConfig } from '@anarchitects/auth-angular/config';
import { lastValueFrom, of } from 'rxjs';
import { authBearerTokenInterceptor } from './bearer-token.interceptor';

describe('authBearerTokenInterceptor', () => {
  afterEach(() => {
    localStorage.clear();
  });

  it('adds bearer token when jwt is enabled and token exists', async () => {
    localStorage.setItem('accessToken', 'token-123');

    TestBed.configureTestingModule({
      providers: [
        provideAuthConfig({
          plugins: { jwt: { enabled: true } },
        }),
      ],
    });

    const req = new HttpRequest('GET', '/api/demo');
    const next = vi.fn((request: HttpRequest<unknown>) =>
      of(new HttpResponse({ status: 200, body: request }))
    );

    const response = (await TestBed.runInInjectionContext(() =>
      lastValueFrom(authBearerTokenInterceptor(req, next))
    )) as HttpResponse<unknown>;

    expect(next).toHaveBeenCalledTimes(1);
    const forwarded = response.body as HttpRequest<unknown>;
    expect(forwarded.headers.get('Authorization')).toBe('Bearer token-123');
  });

  it('skips token injection when jwt plugin is disabled', async () => {
    localStorage.setItem('accessToken', 'token-123');

    TestBed.configureTestingModule({
      providers: [
        provideAuthConfig({
          plugins: { jwt: { enabled: false } },
        }),
      ],
    });

    const req = new HttpRequest('GET', '/api/demo');
    const next = vi.fn((request: HttpRequest<unknown>) =>
      of(new HttpResponse({ status: 200, body: request }))
    );

    const response = (await TestBed.runInInjectionContext(() =>
      lastValueFrom(authBearerTokenInterceptor(req, next))
    )) as HttpResponse<unknown>;

    const forwarded = response.body as HttpRequest<unknown>;
    expect(forwarded.headers.has('Authorization')).toBe(false);
  });

  it('preserves an existing Authorization header', async () => {
    localStorage.setItem('accessToken', 'token-123');

    TestBed.configureTestingModule({
      providers: [
        provideAuthConfig({
          plugins: { jwt: { enabled: true } },
        }),
      ],
    });

    const req = new HttpRequest('GET', '/api/demo', undefined, {
      headers: new HttpHeaders({ Authorization: 'Bearer existing-token' }),
    });
    const next = vi.fn((request: HttpRequest<unknown>) =>
      of(new HttpResponse({ status: 200, body: request }))
    );

    const response = (await TestBed.runInInjectionContext(() =>
      lastValueFrom(authBearerTokenInterceptor(req, next))
    )) as HttpResponse<unknown>;

    const forwarded = response.body as HttpRequest<unknown>;
    expect(forwarded.headers.get('Authorization')).toBe('Bearer existing-token');
  });
});
