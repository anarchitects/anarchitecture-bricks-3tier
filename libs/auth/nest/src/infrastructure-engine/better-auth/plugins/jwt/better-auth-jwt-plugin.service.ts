import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import {
  JwtLogoutRequestDTO,
  LoginResponseDTO,
  RefreshTokenRequestDTO,
  RefreshTokenResponseDTO,
} from '@anarchitects/auth-ts/dtos/jwt';
import { LoginRequestDTO } from '@anarchitects/auth-ts/dtos';
import { AuthUser } from '@anarchitects/auth-ts/models';
import { AuthAccountRepository } from '../../../../application/ports/auth-account.repository';
import { AuthUserRepository } from '../../../../application/ports/auth-user.repository';
import { HashService } from '../../../../application/services/hash.service';
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
    const authUser = await this.authUserRepository.findOne({
      where: [{ email: credential }, { name: credential }],
    });
    if (!authUser) {
      throw new BadRequestException('Invalid credentials');
    }

    const credentialAccount =
      await this.authAccountRepository.findCredentialAccountByUserId(
        authUser.id,
      );
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

    return this.generateAuthUserTokens(authUser);
  }

  async logout(dto: JwtLogoutRequestDTO): Promise<{ success: boolean }> {
    const { accessToken, refreshToken } = dto;

    const payload = await this.jwtService
      .verifyAsync(refreshToken)
      .catch(() => {
        throw new BadRequestException('Invalid refresh token');
      });

    if (!payload?.sub) {
      throw new BadRequestException('Invalid refresh token');
    }

    const authUser = await this.authUserRepository.findOne({
      where: { id: payload.sub },
    });

    if (!authUser) {
      throw new BadRequestException('Invalid refresh token');
    }

    const tokenHashes = await Promise.all(
      [accessToken, refreshToken]
        .filter((token): token is string => Boolean(token))
        .map((token) => this.hashService.hash(token)),
    );

    await this.jwtTokenInvalidationRepository.invalidateTokens(
      tokenHashes,
      authUser.id,
    );

    return { success: true };
  }

  async refreshTokens(
    dto: RefreshTokenRequestDTO,
  ): Promise<RefreshTokenResponseDTO> {
    const { refreshToken } = dto;

    const payload = await this.jwtService
      .verifyAsync(refreshToken)
      .catch(() => {
        throw new BadRequestException('Invalid refresh token');
      });

    if (!payload?.sub) {
      throw new BadRequestException('Invalid refresh token');
    }

    const authUser = await this.authUserRepository.findOne({
      where: { id: payload.sub },
    });

    if (!authUser) {
      throw new BadRequestException('User not found');
    }

    const isTokenInvalidated =
      await this.jwtTokenInvalidationRepository.isTokenInvalidated(
        await this.hashService.hash(refreshToken),
      );
    if (isTokenInvalidated) {
      throw new BadRequestException('Refresh token has been invalidated');
    }

    return this.generateAuthUserTokens(authUser);
  }

  private async generateAuthUserTokens(authUser: AuthUser) {
    const payload = {
      sub: authUser.id,
      roles: authUser.roles?.map((role) => role.name),
    };
    const accessToken = await this.jwtService.signAsync(payload);
    const refreshToken = await this.jwtService.signAsync(payload);

    return {
      accessToken,
      refreshToken,
    };
  }
}
