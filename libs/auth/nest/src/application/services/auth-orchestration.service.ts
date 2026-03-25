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
import { PolicyRule, Role, User } from '@anarchitects/auth-ts/models';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthUserRepository } from '../../infrastructure-persistence/repositories/auth-user.repository';
import { AuthEnginePort } from './auth-engine.port';
import { AuthService } from './auth.service';
import { HashService } from './hash.service';
import { toValidatedPersistedPolicyRule } from './persisted-policy-rule';

@Injectable()
export class AuthOrchestrationService implements AuthService {
  constructor(
    private readonly hashService: HashService,
    private readonly authUserRepository: AuthUserRepository,
    private readonly authEnginePort: AuthEnginePort,
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
    dto: ActivateUserRequestDTO,
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
    return this.authEnginePort.login(dto);
  }

  async logout(dto: LogoutRequestDTO): Promise<{ success: boolean }> {
    return this.authEnginePort.logout(dto);
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordRequestDTO,
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
      user.passwordHash,
    );
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Invalid current password');
    }
    user.passwordHash = await this.hashService.hash(newPassword);
    await this.authUserRepository.update(user);
    return { success: true };
  }

  async forgotPassword(
    dto: ForgotPasswordRequestDTO,
  ): Promise<{ success: boolean }> {
    const { email } = dto;
    const user = await this.authUserRepository.findOne({ where: { email } });
    if (!user) {
      throw new BadRequestException('User not found');
    }
    const token = crypto.randomUUID();
    user.token = token;
    await this.authUserRepository.update(user);
    return { success: true };
  }

  async resetPassword(
    dto: ResetPasswordRequestDTO,
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
    dto: UpdateEmailRequestDTO,
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
    dto: RefreshTokenRequestDTO,
  ): Promise<LoginResponseDTO> {
    return this.authEnginePort.refreshTokens(userId, dto);
  }

  async getLoggedInUserInfo(
    userId: string,
  ): Promise<{ user: User; rbac: PolicyRule[] }> {
    const user = await this.authUserRepository.findOne({
      where: { id: userId },
      relations: ['roles', 'roles.permissions'],
    });
    if (!user) {
      throw new BadRequestException('User not found');
    }

    const rbac = this.getValidatedPolicyRules(user);
    return { user, rbac };
  }

  private getValidatedPolicyRules(user: User): PolicyRule[] {
    try {
      const rbac: PolicyRule[] = [];
      user.roles?.forEach((role) => {
        role.permissions?.forEach((permission) => {
          rbac.push(toValidatedPersistedPolicyRule(permission));
        });
      });

      return rbac;
    } catch (error) {
      throw new InternalServerErrorException(
        `Malformed persisted policy rule payload: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }
}
