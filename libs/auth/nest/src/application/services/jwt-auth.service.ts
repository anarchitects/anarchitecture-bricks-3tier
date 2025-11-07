import { BadRequestException, Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { Role, User } from '@anarchitects/auth-ts/models';
import { AuthService } from './auth.service';
import {
  RegisterRequestDTO,
  RegisterResponseDTO,
  ActivateUserRequestDTO,
  LoginRequestDTO,
  LoginResponseDTO,
  LogoutRequestDTO,
  ChangePasswordRequestDTO,
  ForgotPasswordRequestDTO,
  ResetPasswordRequestDTO,
  VerifyEmailRequestDTO,
  UpdateEmailRequestDTO,
  RefreshTokenRequestDTO,
} from '@anarchitects/auth-ts/dtos';
import { AuthUserRepository } from '../../infrastructure-persistence/repositories/auth-user.repository';
import { HashService } from './hash.service';

@Injectable()
export class JwtAuthService implements AuthService {
  constructor(
    private readonly hashService: HashService,
    private readonly authUserRepository: AuthUserRepository,
    private readonly jwtService: JwtService
  ) {}

  async registerUser(dto: RegisterRequestDTO): Promise<RegisterResponseDTO> {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }
    const passwordHash = await this.hashService.hash(dto.password);
    const token = crypto.randomUUID();
    const { userName, email } = dto;
    const user: Partial<User> = {
      email,
      passwordHash,
      isActive: false,
      userName,
      token,
      roles: [
        {
          name: 'user',
        } as Role,
      ],
    };
    await this.authUserRepository.create(user);
    return { success: true };
  }

  async activateUser(
    dto: ActivateUserRequestDTO
  ): Promise<{ success: boolean }> {
    const { token } = dto;
    const user = await this.authUserRepository.findOne(token);
    await this.authUserRepository.update({
      ...user,
      isActive: true,
      token: null,
    });
    return { success: true };
  }

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
      user.passwordHash
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

    const payload = await this.jwtService
      .verifyAsync(refreshToken)
      .catch(() => {
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
        .map((token) => this.hashService.hash(token))
    );

    await this.authUserRepository.invalidateTokens(tokenHashes, user.id);

    return { success: true };
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordRequestDTO
  ): Promise<{ success: boolean }> {
    const { currentPassword, newPassword, confirmPassword } = dto;
    if (newPassword !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }
    const user = await this.authUserRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const isCurrentPasswordValid = await this.hashService.compare(
      currentPassword,
      user.passwordHash
    );
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Invalid current password');
    }
    user.passwordHash = await this.hashService.hash(newPassword);
    await this.authUserRepository.update(user);
    return { success: true };
  }
  async forgotPassword(
    dto: ForgotPasswordRequestDTO
  ): Promise<{ success: boolean }> {
    const { email } = dto;
    const user = await this.authUserRepository.findOne({ where: { email } });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const token = crypto.randomUUID();
    user.token = token;
    await this.authUserRepository.update(user);
    // Here you would typically send the token to the user's email
    return { success: true };
  }
  async resetPassword(
    dto: ResetPasswordRequestDTO
  ): Promise<{ success: boolean }> {
    const { token, password, confirmPassword } = dto;
    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }
    const user = await this.authUserRepository.findOne({ where: { token } });
    if (!user) {
      throw new BadRequestException('Invalid token');
    }
    user.passwordHash = await this.hashService.hash(password);
    user.token = null;
    await this.authUserRepository.update(user);
    return { success: true };
  }
  async verifyEmail(dto: VerifyEmailRequestDTO): Promise<{ success: boolean }> {
    const { token } = dto;
    const user = await this.authUserRepository.findOne({ where: { token } });
    if (!user) {
      throw new BadRequestException('Invalid token');
    }
    user.isActive = true;
    user.token = null;
    await this.authUserRepository.update(user);
    return { success: true };
  }

  async updateEmail(
    userId: string,
    dto: UpdateEmailRequestDTO
  ): Promise<{ success: boolean }> {
    const { newEmail, password } = dto;
    const user = await this.authUserRepository.findOne({
      where: { id: userId },
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const isPasswordValid =
      password && (await this.hashService.compare(password, user.passwordHash));
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid password');
    }
    user.email = newEmail;
    await this.authUserRepository.update(user);
    return { success: true };
  }

  async refreshTokens(
    userId: string,
    dto: RefreshTokenRequestDTO
  ): Promise<LoginResponseDTO> {
    const { refreshToken } = dto;
    const payload = await this.jwtService
      .verifyAsync(refreshToken)
      .catch(() => {
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
      await this.hashService.hash(refreshToken)
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
