import {
  LoginRequestDTO,
  LoginResponseDTO,
  LogoutRequestDTO,
  RefreshTokenRequestDTO,
} from '@anarchitects/auth-ts/dtos';
import { User } from '@anarchitects/auth-ts/models';
import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { AuthEnginePort } from '../application/services/auth-engine.port';
import { HashService } from '../application/services/hash.service';
import { AuthUserRepository } from '../infrastructure-persistence/repositories/auth-user.repository';

@Injectable()
export class LegacyJwtAuthEngineAdapter implements AuthEnginePort {
  constructor(
    private readonly hashService: HashService,
    private readonly authUserRepository: AuthUserRepository,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginRequestDTO): Promise<LoginResponseDTO> {
    const { credential, password } = dto;
    const user = await this.authUserRepository.findOne({
      where: [{ email: credential }, { userName: credential }],
    });
    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }
    const isPasswordValid = await this.hashService.compare(
      password,
      user.passwordHash,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid credentials');
    }
    return this.generateTokens(user);
  }

  async logout(dto: LogoutRequestDTO): Promise<{ success: boolean }> {
    const { accessToken, refreshToken } = dto;

    if (!refreshToken) {
      throw new BadRequestException('Refresh token is required');
    }

    const payload = await this.jwtService.verifyAsync(refreshToken).catch(() => {
      throw new BadRequestException('Invalid refresh token');
    });

    if (!payload?.sub) {
      throw new BadRequestException('Invalid refresh token');
    }

    const user = await this.authUserRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user?.id) {
      throw new BadRequestException('Invalid refresh token');
    }

    const tokenHashes = await Promise.all(
      [accessToken, refreshToken]
        .filter((token): token is string => Boolean(token))
        .map((token) => this.hashService.hash(token)),
    );

    await this.authUserRepository.invalidateTokens(tokenHashes, user.id);

    return { success: true };
  }

  async refreshTokens(
    userId: string,
    dto: RefreshTokenRequestDTO,
  ): Promise<LoginResponseDTO> {
    const { refreshToken } = dto;
    const payload = await this.jwtService.verifyAsync(refreshToken).catch(() => {
      throw new BadRequestException('Invalid refresh token');
    });

    if (!payload?.sub || payload.sub !== userId) {
      throw new BadRequestException('Invalid refresh token');
    }

    const user = await this.authUserRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const isTokenInvalidated = await this.authUserRepository.isTokenInvalidated(
      await this.hashService.hash(refreshToken),
    );

    if (isTokenInvalidated) {
      throw new BadRequestException('Refresh token has been invalidated');
    }

    return this.generateTokens(user);
  }

  private async generateTokens(user: User) {
    const payload = {
      sub: user.id,
      roles: user.roles?.map((role) => role.name),
    };
    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = await this.jwtService.signAsync(payload);
    return { accessToken, refreshToken };
  }
}
