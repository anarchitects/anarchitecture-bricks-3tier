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
import { PolicyRule, User } from '@anarchitects/auth-ts/models';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthAccountRepository } from '../../infrastructure-persistence/repositories/auth-account.repository';
import { AuthUserRepository } from '../../infrastructure-persistence/repositories/auth-user.repository';
import { AuthEnginePort } from './auth-engine.port';
import { AuthHttpResult, AuthService } from './auth.service';
import { HashService } from './hash.service';
import { toValidatedPersistedPolicyRule } from './persisted-policy-rule';

@Injectable()
export class AuthOrchestrationService implements AuthService {
  constructor(
    private readonly hashService: HashService,
    private readonly authAccountRepository: AuthAccountRepository,
    private readonly authUserRepository: AuthUserRepository,
    private readonly authEnginePort: AuthEnginePort,
  ) {}

  async registerUser(dto: RegisterRequestDTO): Promise<RegisterResponseDTO> {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const existingUsers = await this.authUserRepository.find({
      where: { email: dto.email },
    });
    if (existingUsers.length > 0) {
      throw new BadRequestException('User already exists');
    }

    const result = await this.authEnginePort.register(dto);
    const userId = result.userId ?? (await this.findUserIdByEmail(dto.email));

    await this.authUserRepository.ensureRole(userId, 'user');

    return { success: true };
  }

  async activateUser(
    dto: ActivateUserRequestDTO,
  ): Promise<{ success: boolean }> {
    return this.verifyEmail(dto);
  }

  async login(
    dto: LoginRequestDTO,
    headers?: HeadersInit,
  ): Promise<AuthHttpResult<LoggedInUserInfoResponseDTO>> {
    const session = await this.authEnginePort.login(dto, headers);
    const body = await this.buildLoggedInUserInfo(session.userId);

    return {
      body,
      headers: session.headers,
    };
  }

  async logout(
    dto: LogoutRequestDTO,
    headers?: HeadersInit,
  ): Promise<AuthHttpResult<{ success: boolean }>> {
    const result = await this.authEnginePort.logout(dto, headers);

    return {
      body: { success: result.success },
      headers: result.headers,
    };
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
    const currentPasswordHash = await this.getCredentialPasswordHashOrThrow(
      user.id,
      'Invalid current password',
    );
    const isCurrentPasswordValid = await this.hashService.compare(
      currentPassword,
      currentPasswordHash,
    );
    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Invalid current password');
    }
    const newPasswordHash = await this.hashService.hash(newPassword);
    await this.authAccountRepository.upsertCredentialAccount({
      userId: user.id,
      passwordHash: newPasswordHash,
    });
    return { success: true };
  }

  async forgotPassword(
    dto: ForgotPasswordRequestDTO,
  ): Promise<{ success: boolean }> {
    await this.authEnginePort.requestPasswordReset(dto);
    return { success: true };
  }

  async resetPassword(
    dto: ResetPasswordRequestDTO,
  ): Promise<{ success: boolean }> {
    const { password, confirmPassword } = dto;
    if (password !== confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }
    await this.runEngineMutationOrThrow(
      () => this.authEnginePort.resetPassword(dto),
      'Invalid token',
    );
    return { success: true };
  }

  async verifyEmail(dto: VerifyEmailRequestDTO): Promise<{ success: boolean }> {
    await this.runEngineMutationOrThrow(
      () => this.authEnginePort.verifyEmail(dto.token),
      'Invalid token',
    );
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
    const passwordHash = password
      ? await this.getCredentialPasswordHashOrThrow(
          user.id,
          'Invalid password',
        )
      : null;
    const isPasswordValid =
      password && passwordHash
        ? await this.hashService.compare(password, passwordHash)
        : false;
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid password');
    }
    user.email = newEmail;
    await this.authUserRepository.update(user);
    return { success: true };
  }

  async getLoggedInUserInfo(
    headers?: HeadersInit,
  ): Promise<AuthHttpResult<{ user: User; rbac: PolicyRule[] }>> {
    const session = await this.authEnginePort.getSession(headers);
    if (!session) {
      throw new BadRequestException('No active auth session');
    }

    return {
      body: await this.buildLoggedInUserInfo(session.userId),
      headers: session.headers,
    };
  }

  private async buildLoggedInUserInfo(
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

  private async findUserIdByEmail(email: string): Promise<string> {
    const users = await this.authUserRepository.find({ where: { email } });
    const userId = users[0]?.id;
    if (!userId) {
      throw new InternalServerErrorException(
        'Better Auth sign-up completed without a resolvable user record.',
      );
    }

    return userId;
  }

  private async runEngineMutationOrThrow(
    action: () => Promise<unknown>,
    errorMessage: string,
  ): Promise<void> {
    try {
      await action();
    } catch {
      throw new BadRequestException(errorMessage);
    }
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

  private async getCredentialPasswordHashOrThrow(
    userId: string,
    errorMessage: string,
  ): Promise<string> {
    const credentialAccount =
      await this.authAccountRepository.findCredentialAccountByUserId(userId);
    if (!credentialAccount?.password) {
      throw new BadRequestException(errorMessage);
    }

    return credentialAccount.password;
  }
}
