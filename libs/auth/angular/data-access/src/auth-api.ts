import {
  injectApiResourcePath,
  SUPPRESS_AUTH_FAILURE_REDIRECT,
} from '@anarchitects/auth-angular/config';
import {
  ActivateUserRequestDTO,
  ChangePasswordRequestDTO,
  ForgotPasswordRequestDTO,
  LoginRequestDTO,
  LoggedInUserInfoResponseDTO,
  LogoutRequestDTO,
  RegisterRequestDTO,
  RegisterResponseDTO,
  ResetPasswordRequestDTO,
  UpdateEmailRequestDTO,
  VerifyEmailRequestDTO,
  parsePolicyRuleArrayDTO,
} from '@anarchitects/auth-ts/dtos';
import { AuthUser, PolicyRule } from '@anarchitects/auth-ts/models';
import { HttpClient, HttpContext } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map } from 'rxjs';
export type AuthApiRequestOptions = {
  suppressAuthFailureRedirect?: boolean;
};

@Injectable({
  providedIn: 'root',
})
export class AuthApi {
  private readonly http = inject(HttpClient);
  private readonly resourceUrl = `/api/${injectApiResourcePath()}`;

  registerUser(dto: RegisterRequestDTO) {
    return this.http.post<RegisterResponseDTO>(
      `${this.resourceUrl}/register`,
      dto,
    );
  }

  activateUser(dto: ActivateUserRequestDTO) {
    return this.http.patch<{ success: boolean }>(
      `${this.resourceUrl}/activate`,
      dto,
    );
  }

  login(dto: LoginRequestDTO) {
    return this.http.post<LoggedInUserInfoResponseDTO>(
      `${this.resourceUrl}/login`,
      dto,
    );
  }

  logout(dto: LogoutRequestDTO = {}) {
    return this.http.post<{ success: boolean }>(
      `${this.resourceUrl}/logout`,
      dto,
    );
  }

  changePassword(userId: string, dto: ChangePasswordRequestDTO) {
    return this.http.patch<{ success: boolean }>(
      `${this.resourceUrl}/change-password/${userId}`,
      dto,
    );
  }

  forgotPassword(dto: ForgotPasswordRequestDTO) {
    return this.http.post<{ success: boolean }>(
      `${this.resourceUrl}/forgot-password`,
      dto,
    );
  }

  resetPassword(dto: ResetPasswordRequestDTO) {
    return this.http.post<{ success: boolean }>(
      `${this.resourceUrl}/reset-password`,
      dto,
    );
  }

  verifyEmail(dto: VerifyEmailRequestDTO) {
    return this.http.post<{ success: boolean }>(
      `${this.resourceUrl}/verify-email`,
      dto,
    );
  }

  updateEmail(userId: string, dto: UpdateEmailRequestDTO) {
    return this.http.patch<{ success: boolean }>(
      `${this.resourceUrl}/update-email/${userId}`,
      dto,
    );
  }

  getLoggedInUserInfo(options: AuthApiRequestOptions = {}) {
    const context = options.suppressAuthFailureRedirect
      ? new HttpContext().set(SUPPRESS_AUTH_FAILURE_REDIRECT, true)
      : undefined;

    return this.http
      .get<{
        user: AuthUser;
        rbac: unknown;
      }>(`${this.resourceUrl}/me`, context ? { context } : undefined)
      .pipe(
        map(({ user, rbac }) => ({
          user,
          rbac: parsePolicyRuleArrayDTO(rbac, 'rbac') as PolicyRule[],
        })),
      );
  }
}
