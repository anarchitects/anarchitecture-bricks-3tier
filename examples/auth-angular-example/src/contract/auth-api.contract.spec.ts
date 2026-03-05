import { firstValueFrom } from 'rxjs';
import { TestBed } from '@angular/core/testing';
import {
  HttpInterceptorFn,
  provideHttpClient,
  withInterceptors,
} from '@angular/common/http';
import { AuthApi } from '@anarchitects/auth-angular/data-access';
import { provideAuthConfig } from '@anarchitects/auth-angular/config';

const prismBaseUrlInterceptor: HttpInterceptorFn = (req, next) => {
  const path = req.url.startsWith('/api') ? req.url.slice('/api'.length) : req.url;
  const url = path.startsWith('http')
    ? path
    : `http://127.0.0.1:4010${path}`;
  return next(req.clone({ url }));
};

describe('auth-angular-example contract (Prism)', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      providers: [
        AuthApi,
        provideHttpClient(withInterceptors([prismBaseUrlInterceptor])),
        ...provideAuthConfig({
          apiResourcePath: 'auth',
        }),
      ],
    }).compileComponents();
  });

  it('POST /auth/register returns documented response', async () => {
    const api = TestBed.inject(AuthApi);
    const response = await firstValueFrom(
      api.registerUser({
        email: 'new-user@example.com',
        userName: 'new-user',
        password: 'newpass123',
        confirmPassword: 'newpass123',
      }),
    );

    expect(response).toHaveProperty('success');
  });

  it('PATCH /auth/activate returns documented response', async () => {
    const api = TestBed.inject(AuthApi);
    const response = await firstValueFrom(
      api.activateUser({ token: 'activate-seed-token' }),
    );

    expect(response).toHaveProperty('success');
  });

  it('POST /auth/login returns documented response', async () => {
    const api = TestBed.inject(AuthApi);
    const response = await firstValueFrom(
      api.login({ credential: 'admin@example.com', password: 'adminpass123' }),
    );

    expect(response).toHaveProperty('accessToken');
    expect(response).toHaveProperty('refreshToken');
  });

  it('POST /auth/logout returns documented response', async () => {
    const api = TestBed.inject(AuthApi);
    const response = await firstValueFrom(
      api.logout({ refreshToken: 'refresh-token', accessToken: 'access-token' }),
    );

    expect(response).toHaveProperty('success');
  });

  it('PATCH /auth/change-password/{userId} returns documented response', async () => {
    const api = TestBed.inject(AuthApi);
    const response = await firstValueFrom(
      api.changePassword('admin-user-id', {
        currentPassword: 'adminpass123',
        newPassword: 'newpass123',
        confirmPassword: 'newpass123',
      }),
    );

    expect(response).toHaveProperty('success');
  });

  it('POST /auth/forgot-password returns documented response', async () => {
    const api = TestBed.inject(AuthApi);
    const response = await firstValueFrom(
      api.forgotPassword({ email: 'member@example.com' }),
    );

    expect(response).toHaveProperty('success');
  });

  it('POST /auth/reset-password returns documented response', async () => {
    const api = TestBed.inject(AuthApi);
    const response = await firstValueFrom(
      api.resetPassword({
        token: 'reset-member-user-id',
        password: 'newpass123',
        confirmPassword: 'newpass123',
      }),
    );

    expect(response).toHaveProperty('success');
  });

  it('POST /auth/verify-email returns documented response', async () => {
    const api = TestBed.inject(AuthApi);
    const response = await firstValueFrom(
      api.verifyEmail({ token: 'verify-seed-token' }),
    );

    expect(response).toHaveProperty('success');
  });

  it('PATCH /auth/update-email/{userId} returns documented response', async () => {
    const api = TestBed.inject(AuthApi);
    const response = await firstValueFrom(
      api.updateEmail('admin-user-id', {
        newEmail: 'admin+new@example.com',
        password: 'adminpass123',
      }),
    );

    expect(response).toHaveProperty('success');
  });

  it('POST /auth/refresh-tokens/{userId} returns documented response', async () => {
    const api = TestBed.inject(AuthApi);
    const response = await firstValueFrom(
      api.refreshTokens('admin-user-id', { refreshToken: 'refresh-token' }),
    );

    expect(response).toHaveProperty('accessToken');
    expect(response).toHaveProperty('refreshToken');
  });

  it('GET /auth/me returns documented response', async () => {
    const api = TestBed.inject(AuthApi);
    const response = await firstValueFrom(api.getLoggedInUserInfo());

    expect(response).toHaveProperty('user');
    expect(response).toHaveProperty('rbac');
  });
});
