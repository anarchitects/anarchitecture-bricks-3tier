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
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import { AuthAccountRepository } from '../ports/auth-account.repository';
import { AuthUserRepository } from '../ports/auth-user.repository';
import { AuthEnginePort } from './auth-engine.port';
import { AuthPrincipalResolver } from './auth-principal.resolver';
import {
  AuthHttpResult,
  AuthService,
  LoggedInAuthUserInfo,
} from './auth.service';
import { HashService } from './hash.service';
import { PoliciesService } from './policies.service';

@Injectable()
export class AuthOrchestrationService implements AuthService {
  constructor(
    private readonly hashService: HashService,
    private readonly authAccountRepository: AuthAccountRepository,
    private readonly authUserRepository: AuthUserRepository,
    private readonly authEnginePort: AuthEnginePort,
    private readonly authPrincipalResolver: AuthPrincipalResolver,
    private readonly policiesService: PoliciesService,
  ) {}

  async registerUser(dto: RegisterRequestDTO): Promise<RegisterResponseDTO> {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const existingAuthUsers = await this.authUserRepository.find({
      where: { email: dto.email },
    });
    if (existingAuthUsers.length > 0) {
      throw new BadRequestException('User already exists');
    }

    const result = await this.authEnginePort.register(dto);
    const userId =
      result.userId ?? (await this.findAuthUserIdByEmail(dto.email));

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
    const body = await this.buildLoggedInAuthUserInfo(session.userId);

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
    const authUser = await this.authUserRepository.findOne({
      where: { id: userId },
    });
    if (!authUser) {
      throw new BadRequestException('User not found');
    }
    const currentPasswordHash = await this.getCredentialPasswordHashOrThrow(
      authUser.id,
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
      userId: authUser.id,
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
    const authUser = await this.authUserRepository.findOne({
      where: { id: userId },
    });
    if (!authUser) {
      throw new BadRequestException('User not found');
    }
    const passwordHash = password
      ? await this.getCredentialPasswordHashOrThrow(
          authUser.id,
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
    authUser.email = newEmail;
    await this.authUserRepository.update(authUser);
    return { success: true };
  }

  async getLoggedInUserInfo(
    headers?: HeadersInit,
  ): Promise<AuthHttpResult<LoggedInAuthUserInfo>> {
    const principal =
      await this.authPrincipalResolver.resolveFromHeaders(headers);
    if (!principal) {
      throw new BadRequestException('No active auth session');
    }

    return {
      body: {
        user: principal.user,
        rbac: this.policiesService.rulesForLoadedAuthUser(principal.user),
      },
      headers: principal.headers,
    };
  }

  private async buildLoggedInAuthUserInfo(
    userId: string,
  ): Promise<LoggedInAuthUserInfo> {
    const authUser =
      await this.authPrincipalResolver.resolveAuthUserById(userId);
    if (!authUser) {
      throw new BadRequestException('User not found');
    }

    const rbac = this.policiesService.rulesForLoadedAuthUser(authUser);
    return { user: authUser, rbac };
  }

  private async findAuthUserIdByEmail(email: string): Promise<string> {
    const authUsers = await this.authUserRepository.find({ where: { email } });
    const userId = authUsers[0]?.id;
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
