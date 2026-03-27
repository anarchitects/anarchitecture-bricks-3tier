import { PolicyRule, User } from '@anarchitects/auth-ts';
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
} from '@anarchitects/auth-ts/dtos';
import { Injectable } from '@nestjs/common';

export type AuthHttpResult<T> = {
  body: T;
  headers?: Headers;
};

@Injectable()
export abstract class AuthService {
  abstract registerUser(dto: RegisterRequestDTO): Promise<RegisterResponseDTO>;
  abstract activateUser(
    dto: ActivateUserRequestDTO,
  ): Promise<{ success: boolean }>;
  abstract login(
    dto: LoginRequestDTO,
    headers?: HeadersInit,
  ): Promise<AuthHttpResult<LoggedInUserInfoResponseDTO>>;
  abstract logout(
    dto: LogoutRequestDTO,
    headers?: HeadersInit,
  ): Promise<AuthHttpResult<{ success: boolean }>>;
  abstract changePassword(
    userId: string,
    dto: ChangePasswordRequestDTO,
  ): Promise<{ success: boolean }>;
  abstract forgotPassword(
    dto: ForgotPasswordRequestDTO,
  ): Promise<{ success: boolean }>;
  abstract resetPassword(
    dto: ResetPasswordRequestDTO,
  ): Promise<{ success: boolean }>;
  abstract verifyEmail(
    dto: VerifyEmailRequestDTO,
  ): Promise<{ success: boolean }>;
  abstract updateEmail(
    userId: string,
    dto: UpdateEmailRequestDTO,
  ): Promise<{ success: boolean }>;
  abstract getLoggedInUserInfo(
    headers?: HeadersInit,
  ): Promise<AuthHttpResult<{ user: User; rbac: PolicyRule[] }>>;
}
