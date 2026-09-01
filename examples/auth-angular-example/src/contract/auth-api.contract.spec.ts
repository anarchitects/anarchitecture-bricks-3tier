import {
  provideHttpClient,
  withInterceptors,
  HttpBackend,
  HttpXhrBackend,
  type HttpInterceptorFn,
} from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { provideAuthConfig } from '@anarchitects/auth-angular/config';
import { AuthApi } from '@anarchitects/auth-angular/data-access';
import { firstValueFrom } from 'rxjs';

const prismBaseUrl = process.env['PRISM_BASE_URL'] ?? 'http://127.0.0.1:4010';
const prismUrl: HttpInterceptorFn = (request, next) => {
  const path = request.url.startsWith('/api')
    ? request.url.slice(4)
    : request.url;
  return next(
    request.clone({
      url: path.startsWith('http') ? path : `${prismBaseUrl}${path}`,
    }),
  );
};

describe('auth Angular consumer contract', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        AuthApi,
        provideHttpClient(withInterceptors([prismUrl])),
        { provide: HttpBackend, useClass: HttpXhrBackend },
        provideAuthConfig({ apiResourcePath: 'auth' }),
      ],
    }).compileComponents();
  });

  it('registers through the documented endpoint', async () => {
    const response = await firstValueFrom(
      TestBed.inject(AuthApi).registerUser({
        email: 'new-user@example.com',
        name: 'New User',
        password: 'newpass123',
        confirmPassword: 'newpass123',
      }),
    );
    expect(response).toHaveProperty('success');
  });

  it('logs in through the documented endpoint', async () => {
    const response = await firstValueFrom(
      TestBed.inject(AuthApi).login({
        credential: 'admin@example.com',
        password: 'adminpass123',
      }),
    );
    expect(response).toHaveProperty('user');
    expect(response).toHaveProperty('rbac');
  });
});
