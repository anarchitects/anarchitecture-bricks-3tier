import { injectApiResourcePath } from '@anarchitects/auth-angular/config';
import {
  ActivateUserRequestDTO,
  ChangePasswordRequestDTO,
  ForgotPasswordRequestDTO,
  LoginRequestDTO,
  LoginResponseDTO,
  LogoutRequestDTO,
  RefreshTokenRequestDTO,
  RegisterRequestDTO,
  RegisterResponseDTO,
  ResetPasswordRequestDTO,
  UpdateEmailRequestDTO,
  VerifyEmailRequestDTO,
} from '@anarchitects/auth-ts/dtos';
import { PolicyRule, User } from '@anarchitects/auth-ts/models';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class AuthApi {
  private readonly http = inject(HttpClient);
  private readonly resourceUrl = `/api/${injectApiResourcePath()}`;

  registerUser(dto: RegisterRequestDTO) {
    return this.http.post<RegisterResponseDTO>(
      `${this.resourceUrl}/register`,
      dto
    );
  }

  activateUser(dto: ActivateUserRequestDTO) {
    return this.http.patch<{ success: boolean }>(
      `${this.resourceUrl}/activate`,
      dto
    );
  }

  login(dto: LoginRequestDTO) {
    return this.http.post<LoginResponseDTO>(`${this.resourceUrl}/login`, dto);
  }

  logout(dto: LogoutRequestDTO) {
    return this.http.post<{ success: boolean }>(
      `${this.resourceUrl}/logout`,
      dto
    );
  }

  changePassword(userId: string, dto: ChangePasswordRequestDTO) {
    return this.http.patch<{ success: boolean }>(
      `${this.resourceUrl}/change-password/${userId}`,
      dto
    );
  }

  forgotPassword(dto: ForgotPasswordRequestDTO) {
    return this.http.post<{ success: boolean }>(
      `${this.resourceUrl}/forgot-password`,
      dto
    );
  }

  resetPassword(dto: ResetPasswordRequestDTO) {
    return this.http.post<{ success: boolean }>(
      `${this.resourceUrl}/reset-password`,
      dto
    );
  }

  verifyEmail(dto: VerifyEmailRequestDTO) {
    return this.http.post<{ success: boolean }>(
      `${this.resourceUrl}/verify-email`,
      dto
    );
  }

  updateEmail(userId: string, dto: UpdateEmailRequestDTO) {
    return this.http.patch<{ success: boolean }>(
      `${this.resourceUrl}/update-email/${userId}`,
      dto
    );
  }

  refreshTokens(userId: string, dto: RefreshTokenRequestDTO) {
    return this.http.post<LoginResponseDTO>(
      `${this.resourceUrl}/refresh-tokens/${userId}`,
      dto
    );
  }

  getLoggedInUserInfo() {
    return this.http.get<{ user: User; rbac: PolicyRule[] }>(
      `${this.resourceUrl}/me`
    );
  }
}
