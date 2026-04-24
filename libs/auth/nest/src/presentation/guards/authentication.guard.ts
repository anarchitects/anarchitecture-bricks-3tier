import { AUTH_PUBLIC_METADATA_KEY } from '@anarchitects/auth-declarations';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthPrincipalResolver } from '../../application/services/auth-principal.resolver';
import { AuthRuntimeRequest } from './authenticated-user';

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authPrincipalResolver: AuthPrincipalResolver,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(
      AUTH_PUBLIC_METADATA_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthRuntimeRequest>();
    if (request.user) {
      return true;
    }

    const principal = await this.authPrincipalResolver.requireFromHeaders(
      request.headers,
    );
    request.user = principal.user;

    return true;
  }
}
