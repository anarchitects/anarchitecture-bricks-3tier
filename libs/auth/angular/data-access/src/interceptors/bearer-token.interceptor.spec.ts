import {
  HttpClient,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideAuthConfig } from '@anarchitects/auth-angular/config';
import { authBearerTokenInterceptor } from './bearer-token.interceptor';

describe('authBearerTokenInterceptor', () => {
  let http: HttpClient;
  let httpController: HttpTestingController;

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
        provideHttpClient(withInterceptors([authBearerTokenInterceptor])),
        provideHttpClientTesting(),
      ],
    });

    http = TestBed.inject(HttpClient);
    httpController = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    localStorage.clear();
    httpController.verify();
  });

  it('should add Authorization bearer token when access token is present', () => {
    localStorage.setItem('accessToken', 'token-123');

    http.get('/api/protected').subscribe();

    const req = httpController.expectOne('/api/protected');
    expect(req.request.headers.get('Authorization')).toBe('Bearer token-123');
    req.flush({ ok: true });
  });

  it('should not overwrite an existing Authorization header', () => {
    localStorage.setItem('accessToken', 'token-123');

    http
      .get('/api/protected', {
        headers: {
          Authorization: 'Basic pre-existing',
        },
      })
      .subscribe();

    const req = httpController.expectOne('/api/protected');
    expect(req.request.headers.get('Authorization')).toBe('Basic pre-existing');
    req.flush({ ok: true });
  });

  it('should leave request unchanged when access token is missing', () => {
    http.get('/api/protected').subscribe();

    const req = httpController.expectOne('/api/protected');
    expect(req.request.headers.has('Authorization')).toBe(false);
    req.flush({ ok: true });
  });
});
