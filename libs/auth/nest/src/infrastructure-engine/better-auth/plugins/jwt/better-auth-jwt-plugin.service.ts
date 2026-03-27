import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  JwtLogoutRequestDTO,
  LoginRequestDTO,
  LoginResponseDTO,
  RefreshTokenRequestDTO,
  RefreshTokenResponseDTO,
} from '@anarchitects/auth-ts/dtos';
import { User } from '@anarchitects/auth-ts/models';
import { HashService } from '../../../../application/services/hash.service';
import { AuthAccountRepository } from '../../../../infrastructure-persistence/repositories/auth-account.repository';
import { AuthUserRepository } from '../../../../infrastructure-persistence/repositories/auth-user.repository';
import { JwtTokenInvalidationRepository } from './jwt-token-invalidation.repository';

@Injectable()
export class BetterAuthJwtPluginService {
  constructor(
    private readonly hashService: HashService,
    private readonly authAccountRepository: AuthAccountRepository,
    private readonly authUserRepository: AuthUserRepository,
    private readonly jwtTokenInvalidationRepository: JwtTokenInvalidationRepository,
    private readonly jwtService: JwtService,
  ) {}

  async login(dto: LoginRequestDTO): Promise<LoginResponseDTO> {
    const { credential, password } = dto;
    const user = await this.authUserRepository.findOne({
      where: [{ email: credential }, { name: credential }],
    });
    if (!user) {
      throw new BadRequestException('Invalid credentials');
    }

    const credentialAccount =
      await this.authAccountRepository.findCredentialAccountByUserId(user.id);
    if (!credentialAccount?.password) {
      throw new BadRequestException('Invalid credentials');
    }

    const isPasswordValid = await this.hashService.compare(
      password,
      credentialAccount.password,
    );
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid credentials');
    }

    return this.generateTokens(user);
  }

  async logout(dto: JwtLogoutRequestDTO): Promise<{ success: boolean }> {
    const { accessToken, refreshToken } = dto;

    const payload = await this.jwtService.verifyAsync(refreshToken).catch(() => {
      throw new BadRequestException('Invalid refresh token');
    });

    if (!payload?.sub) {
      throw new BadRequestException('Invalid refresh token');
    }

    const user = await this.authUserRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new BadRequestException('Invalid refresh token');
    }

    const tokenHashes = await Promise.all(
      [accessToken, refreshToken]
        .filter((token): token is string => Boolean(token))
        .map((token) => this.hashService.hash(token)),
    );

    await this.jwtTokenInvalidationRepository.invalidateTokens(
      tokenHashes,
      user.id,
    );

    return { success: true };
  }

  async refreshTokens(
    dto: RefreshTokenRequestDTO,
  ): Promise<RefreshTokenResponseDTO> {
    const { refreshToken } = dto;

    const payload = await this.jwtService.verifyAsync(refreshToken).catch(() => {
      throw new BadRequestException('Invalid refresh token');
    });

    if (!payload?.sub) {
      throw new BadRequestException('Invalid refresh token');
    }

    const user = await this.authUserRepository.findOne({
      where: { id: payload.sub },
    });

    if (!user) {
      throw new BadRequestException('User not found');
    }

    const isTokenInvalidated =
      await this.jwtTokenInvalidationRepository.isTokenInvalidated(
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

    return {
      accessToken,
      refreshToken,
    };
  }
}
