import { Injectable } from '@nestjs/common';
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

@Injectable()
export abstract class AuthService {
  abstract registerUser(dto: RegisterRequestDTO): Promise<RegisterResponseDTO>;
  abstract activateUser(
    dto: ActivateUserRequestDTO
  ): Promise<{ success: boolean }>;
  abstract login(dto: LoginRequestDTO): Promise<LoginResponseDTO>;
  abstract logout(dto: LogoutRequestDTO): Promise<{ success: boolean }>;
  abstract changePassword(
    userId: string,
    dto: ChangePasswordRequestDTO
  ): Promise<{ success: boolean }>;
  abstract forgotPassword(
    dto: ForgotPasswordRequestDTO
  ): Promise<{ success: boolean }>;
  abstract resetPassword(
    dto: ResetPasswordRequestDTO
  ): Promise<{ success: boolean }>;
  abstract verifyEmail(
    dto: VerifyEmailRequestDTO
  ): Promise<{ success: boolean }>;
  abstract updateEmail(
    userId: string,
    dto: UpdateEmailRequestDTO
  ): Promise<{ success: boolean }>;
  abstract refreshTokens(
    userId: string,
    dto: RefreshTokenRequestDTO
  ): Promise<LoginResponseDTO>;
}
