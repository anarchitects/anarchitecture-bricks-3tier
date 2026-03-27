import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { AuthApi } from './auth-api';
import { SUPPRESS_AUTH_FAILURE_REDIRECT } from './interceptors/auth-error.interceptor';

describe('AuthApi', () => {
  let service: AuthApi;
  let httpController: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(AuthApi);
    httpController = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    httpController.verify();
    TestBed.resetTestingModule();
  });
  it('should be created', () => {
    expect(service).toBeTruthy();
  });
  describe('registerUser', () => {
    it('should call the register endpoint', () => {
      const dto = {
        email: 'test@example.com',
        password: 'password123',
        confirmPassword: 'password123',
      };
      service.registerUser(dto).subscribe();
      const req = httpController.expectOne('/api/auth/register');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush({ success: true });
    });
  });
  describe('login', () => {
    it('should call the login endpoint', () => {
      const dto = {
        credential: 'test@example.com',
        password: 'password123',
      };
      service.login(dto).subscribe();
      const req = httpController.expectOne('/api/auth/login');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush({
        user: { id: 'user-123', email: 'user@example.com' },
        rbac: [],
      });
    });
  });
  describe('logout', () => {
    it('should call the logout endpoint', () => {
      const dto = {};
      service.logout(dto).subscribe();
      const req = httpController.expectOne('/api/auth/logout');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush({ success: true });
    });
  });
  describe('activateUser', () => {
    it('should call the activate endpoint', () => {
      const dto = {
        token: 'some-activation-code',
      };
      service.activateUser(dto).subscribe();
      const req = httpController.expectOne('/api/auth/activate');
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(dto);
      req.flush({ success: true });
    });
  });
  describe('changePassword', () => {
    it('should call the change password endpoint', () => {
      const userId = 'user-123';
      const dto = {
        currentPassword: 'oldPassword123',
        newPassword: 'newPassword456',
        confirmPassword: 'newPassword456',
      };
      service.changePassword(userId, dto).subscribe();
      const req = httpController.expectOne(
        `/api/auth/change-password/${userId}`,
      );
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(dto);
      req.flush({ success: true });
    });
  });
  describe('forgotPassword', () => {
    it('should call the forgot password endpoint', () => {
      const dto = {
        email: 'test@example.com',
      };
      service.forgotPassword(dto).subscribe();
      const req = httpController.expectOne('/api/auth/forgot-password');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush({ success: true });
    });
  });
  describe('resetPassword', () => {
    it('should call the reset password endpoint', () => {
      const dto = {
        token: 'some-reset-token',
        password: 'newPassword456',
        confirmPassword: 'newPassword456',
      };
      service.resetPassword(dto).subscribe();
      const req = httpController.expectOne('/api/auth/reset-password');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush({ success: true });
    });
  });
  describe('verifyEmail', () => {
    it('should call the verify email endpoint', () => {
      const dto = {
        token: 'some-verification-token',
      };
      service.verifyEmail(dto).subscribe();
      const req = httpController.expectOne('/api/auth/verify-email');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush({ success: true });
    });
  });
  describe('updateEmail', () => {
    it('should call the update email endpoint', () => {
      const userId = 'user-123';
      const dto = {
        newEmail: 'newemail@example.com',
      };
      service.updateEmail(userId, dto).subscribe();
      const req = httpController.expectOne(`/api/auth/update-email/${userId}`);
      expect(req.request.method).toBe('PATCH');
      expect(req.request.body).toEqual(dto);
      req.flush({ success: true });
    });
  });
  describe('refreshTokens', () => {
    it('should call the JWT refresh token endpoint', () => {
      const dto = {
        refreshToken: 'some-refresh-token',
      };
      service.refreshTokens(dto).subscribe();
      const req = httpController.expectOne('/api/auth/jwt/refresh');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(dto);
      req.flush({
        accessToken: 'new-access-token',
        refreshToken: 'new-refresh-token',
      });
    });
  });

  describe('getLoggedInUserInfo', () => {
    it('should call the logged-in user info endpoint', () => {
      service.getLoggedInUserInfo().subscribe();
      const req = httpController.expectOne('/api/auth/me');
      expect(req.request.method).toBe('GET');
      req.flush({
        user: { id: 'user-123', email: 'user@example.com' },
        rbac: [{ action: 'read', subject: 'Project' }],
      });
    });

    it('should optionally suppress auth failure redirects for startup restore', () => {
      service
        .getLoggedInUserInfo({ suppressAuthFailureRedirect: true })
        .subscribe();
      const req = httpController.expectOne('/api/auth/me');

      expect(req.request.context.get(SUPPRESS_AUTH_FAILURE_REDIRECT)).toBe(
        true,
      );

      req.flush({
        user: { id: 'user-123', email: 'user@example.com' },
        rbac: [{ action: 'read', subject: 'Project' }],
      });
    });

    it('should reject malformed rbac payloads at the API boundary', async () => {
      const responsePromise = firstValueFrom(service.getLoggedInUserInfo());
      const req = httpController.expectOne('/api/auth/me');

      req.flush({
        user: { id: 'user-123', email: 'user@example.com' },
        rbac: [{ action: 'read', subject: '' }],
      });

      await expect(responsePromise).rejects.toThrow(/Invalid rbac/);
    });
  });
});
