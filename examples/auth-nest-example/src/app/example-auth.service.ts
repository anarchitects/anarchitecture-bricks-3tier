import { PolicyRule, User } from '@anarchitects/auth-ts/models';
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
import { BadRequestException, Injectable } from '@nestjs/common';
import { AuthService } from '@anarchitects/auth-nest/application';
import { AUTH_EXAMPLE_SEEDS } from './example-auth.constants';

type StoredUser = {
  id: string;
  email: string;
  userName: string;
  password: string;
  isActive: boolean;
  token: string | null;
  rbac: PolicyRule[];
  createdAt: Date;
  updatedAt: Date;
};

type RefreshSession = {
  userId: string;
  invalidated: boolean;
};

type DecodedToken = {
  sub: string;
  tokenType: 'access' | 'refresh';
  iat: number;
  jti: string;
};

export type ExampleRequestUser = {
  sub: string;
  id: string;
  email: string;
  rbac: PolicyRule[];
};

@Injectable()
export class ExampleAuthService implements AuthService {
  private users: StoredUser[] = this.createSeedUsers();
  private refreshSessions = new Map<string, RefreshSession>();
  private invalidatedAccessTokens = new Set<string>();
  private nextUserNumber = 1;
  private nextTokenNumber = 1;

  async registerUser(dto: RegisterRequestDTO): Promise<RegisterResponseDTO> {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    if (this.users.some((user) => user.email === dto.email)) {
      throw new BadRequestException('Email already in use');
    }

    if (
      dto.userName &&
      this.users.some((user) => user.userName === dto.userName)
    ) {
      throw new BadRequestException('Username already in use');
    }

    const id = `user-${String(this.nextUserNumber).padStart(4, '0')}`;
    this.nextUserNumber += 1;

    this.users.push({
      id,
      email: dto.email,
      userName: dto.userName ?? `user-${id}`,
      password: dto.password,
      isActive: false,
      token: `activate-${id}`,
      rbac: [],
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    return { success: true };
  }

  async activateUser(
    dto: ActivateUserRequestDTO,
  ): Promise<{ success: boolean }> {
    const user = this.findByToken(dto.token);
    if (!user) {
      throw new BadRequestException('Invalid token');
    }

    user.isActive = true;
    user.token = null;
    user.updatedAt = new Date();
    return { success: true };
  }

  async login(dto: LoginRequestDTO): Promise<LoginResponseDTO> {
    const user = this.users.find(
      (entry) =>
        entry.email === dto.credential || entry.userName === dto.credential,
    );

    if (!user || user.password !== dto.password || !user.isActive) {
      throw new BadRequestException('Invalid credentials');
    }

    return this.issueTokens(user.id);
  }

  async logout(dto: LogoutRequestDTO): Promise<{ success: boolean }> {
    const session = this.refreshSessions.get(dto.refreshToken);

    if (!session || session.invalidated) {
      throw new BadRequestException('Invalid refresh token');
    }

    session.invalidated = true;
    if (dto.accessToken) {
      this.invalidatedAccessTokens.add(dto.accessToken);
    }

    return { success: true };
  }

  async changePassword(
    userId: string,
    dto: ChangePasswordRequestDTO,
  ): Promise<{ success: boolean }> {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const user = this.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (user.password !== dto.currentPassword) {
      throw new BadRequestException('Invalid current password');
    }

    user.password = dto.newPassword;
    user.updatedAt = new Date();
    return { success: true };
  }

  async forgotPassword(
    dto: ForgotPasswordRequestDTO,
  ): Promise<{ success: boolean }> {
    const user = this.users.find((entry) => entry.email === dto.email);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    user.token = `reset-${user.id}`;
    user.updatedAt = new Date();
    return { success: true };
  }

  async resetPassword(
    dto: ResetPasswordRequestDTO,
  ): Promise<{ success: boolean }> {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const user = this.findByToken(dto.token);
    if (!user) {
      throw new BadRequestException('Invalid token');
    }

    user.password = dto.password;
    user.token = null;
    user.updatedAt = new Date();
    return { success: true };
  }

  async verifyEmail(dto: VerifyEmailRequestDTO): Promise<{ success: boolean }> {
    const user = this.findByToken(dto.token);
    if (!user) {
      throw new BadRequestException('Invalid token');
    }

    user.isActive = true;
    user.token = null;
    user.updatedAt = new Date();
    return { success: true };
  }

  async updateEmail(
    userId: string,
    dto: UpdateEmailRequestDTO,
  ): Promise<{ success: boolean }> {
    const user = this.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    if (!dto.password || user.password !== dto.password) {
      throw new BadRequestException('Invalid password');
    }

    if (this.users.some((entry) => entry.email === dto.newEmail && entry.id !== userId)) {
      throw new BadRequestException('Email already in use');
    }

    user.email = dto.newEmail;
    user.updatedAt = new Date();
    return { success: true };
  }

  async refreshTokens(
    userId: string,
    dto: RefreshTokenRequestDTO,
  ): Promise<LoginResponseDTO> {
    const session = this.refreshSessions.get(dto.refreshToken);
    if (!session || session.invalidated || session.userId !== userId) {
      throw new BadRequestException('Invalid refresh token');
    }

    session.invalidated = true;
    return this.issueTokens(userId);
  }

  async getLoggedInUserInfo(
    userId: string,
  ): Promise<{ user: User; rbac: PolicyRule[] }> {
    const user = this.findById(userId);
    if (!user) {
      throw new BadRequestException('User not found');
    }

    return {
      user: this.toUserModel(user),
      rbac: [...user.rbac],
    };
  }

  resolveAccessToken(accessToken: string | undefined): ExampleRequestUser | null {
    if (!accessToken || this.invalidatedAccessTokens.has(accessToken)) {
      return null;
    }

    const payload = this.decodeToken(accessToken);
    if (!payload || payload.tokenType !== 'access') {
      return null;
    }

    const user = this.findById(payload.sub);
    if (!user || !user.isActive) {
      return null;
    }

    return {
      sub: user.id,
      id: user.id,
      email: user.email,
      rbac: [...user.rbac],
    };
  }

  private issueTokens(userId: string): LoginResponseDTO {
    const accessToken = this.createToken(userId, 'access');
    const refreshToken = this.createToken(userId, 'refresh');
    this.refreshSessions.set(refreshToken, { userId, invalidated: false });

    return {
      accessToken,
      refreshToken,
    };
  }

  private createToken(userId: string, tokenType: 'access' | 'refresh'): string {
    const jti = `token-${String(this.nextTokenNumber).padStart(6, '0')}`;
    this.nextTokenNumber += 1;

    const header = this.base64UrlEncode({ alg: 'none', typ: 'JWT' });
    const payload = this.base64UrlEncode({
      sub: userId,
      tokenType,
      iat: Math.floor(Date.now() / 1000),
      jti,
    });

    return `${header}.${payload}.signature`;
  }

  private decodeToken(token: string): DecodedToken | null {
    const segments = token.split('.');
    if (segments.length < 2) {
      return null;
    }

    try {
      const payloadSegment = segments[1]
        .replace(/-/g, '+')
        .replace(/_/g, '/')
        .padEnd(Math.ceil(segments[1].length / 4) * 4, '=');
      return JSON.parse(Buffer.from(payloadSegment, 'base64').toString('utf8'));
    } catch {
      return null;
    }
  }

  private base64UrlEncode(value: object): string {
    return Buffer.from(JSON.stringify(value), 'utf8')
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/g, '');
  }

  private findById(userId: string): StoredUser | undefined {
    return this.users.find((user) => user.id === userId);
  }

  private findByToken(token: string): StoredUser | undefined {
    return this.users.find((user) => user.token === token);
  }

  private toUserModel(user: StoredUser): User {
    return {
      id: user.id,
      email: user.email,
      userName: user.userName,
      passwordHash: `plain:${user.password}`,
      token: user.token,
      isActive: user.isActive,
      roles: null,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private createSeedUsers(): StoredUser[] {
    const now = new Date('2024-01-01T00:00:00.000Z');

    return [
      {
        ...AUTH_EXAMPLE_SEEDS.admin,
        isActive: true,
        token: null,
        rbac: [...AUTH_EXAMPLE_SEEDS.admin.rbac],
        createdAt: now,
        updatedAt: now,
      },
      {
        ...AUTH_EXAMPLE_SEEDS.member,
        isActive: true,
        token: null,
        rbac: [...AUTH_EXAMPLE_SEEDS.member.rbac],
        createdAt: now,
        updatedAt: now,
      },
      {
        ...AUTH_EXAMPLE_SEEDS.pending,
        isActive: false,
        token: AUTH_EXAMPLE_SEEDS.pending.token,
        rbac: [...AUTH_EXAMPLE_SEEDS.pending.rbac],
        createdAt: now,
        updatedAt: now,
      },
      {
        ...AUTH_EXAMPLE_SEEDS.verify,
        isActive: false,
        token: AUTH_EXAMPLE_SEEDS.verify.token,
        rbac: [...AUTH_EXAMPLE_SEEDS.verify.rbac],
        createdAt: now,
        updatedAt: now,
      },
    ];
  }
}
