import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthPrincipalResolver } from '../../application/services/auth-principal.resolver';
import { AuthRuntimeRequest } from './authenticated-user';
import { isPublicRoute } from './public-route';

@Injectable()
export class AuthenticationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly authPrincipalResolver: AuthPrincipalResolver,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (isPublicRoute(this.reflector, context)) {
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
