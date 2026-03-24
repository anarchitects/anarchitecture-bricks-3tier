import {
  LoginRequestDTO,
  LoginResponseDTO,
  LogoutRequestDTO,
  RefreshTokenRequestDTO,
} from '@anarchitects/auth-ts/dtos';

export abstract class AuthEnginePort {
  abstract login(dto: LoginRequestDTO): Promise<LoginResponseDTO>;
  abstract logout(dto: LogoutRequestDTO): Promise<{ success: boolean }>;
  abstract refreshTokens(
    userId: string,
    dto: RefreshTokenRequestDTO,
  ): Promise<LoginResponseDTO>;
}
