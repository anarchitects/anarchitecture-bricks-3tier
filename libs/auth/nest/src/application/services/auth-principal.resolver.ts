import { AuthUser } from '@anarchitects/auth-ts/models';
import {
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthUserRepository } from '../ports/auth-user.repository';
import { AuthEnginePort } from './auth-engine.port';
import { AuthRequestHeaders, toAuthHeaders } from './auth-headers';

export type AuthPrincipal = {
  user: AuthUser;
  headers?: Headers;
};

@Injectable()
export class AuthPrincipalResolver {
  constructor(
    private readonly authEnginePort: AuthEnginePort,
    private readonly authUserRepository: AuthUserRepository,
  ) {}

  async resolveFromHeaders(
    headers?: AuthRequestHeaders,
  ): Promise<AuthPrincipal | null> {
    const session = await this.authEnginePort.getSession(
      toAuthHeaders(headers),
    );
    if (!session) {
      return null;
    }

    const authUser = await this.resolveAuthUserById(session.userId);
    if (!authUser) {
      return null;
    }

    return {
      user: authUser,
      headers: session.headers,
    };
  }

  async requireFromHeaders(
    headers?: AuthRequestHeaders,
  ): Promise<AuthPrincipal> {
    const principal = await this.resolveFromHeaders(headers);
    if (!principal) {
      throw new UnauthorizedException('User not authenticated');
    }

    return principal;
  }

  async resolveAuthUserById(userId: string): Promise<AuthUser | null> {
    try {
      return await this.authUserRepository.findOne({
        where: { id: userId },
        relations: ['roles', 'roles.permissions'],
      });
    } catch (error) {
      if (error instanceof NotFoundException) {
        return null;
      }

      throw error;
    }
  }

  async resolveUserById(userId: string): Promise<AuthUser | null> {
    return this.resolveAuthUserById(userId);
  }
}
