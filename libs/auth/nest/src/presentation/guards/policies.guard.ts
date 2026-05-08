import { POLICIES_KEY, RoutePolicy } from '@anarchitects/auth-declarations';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PoliciesService } from '../../application/services/policies.service';
import {
  AuthRuntimeRequest,
  requireAuthenticatedAuthUser,
} from './authenticated-user';
import { isPublicRoute } from './public-route';

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly policiesService: PoliciesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (isPublicRoute(this.reflector, context)) {
      return true;
    }

    const policies = this.reflector.getAllAndOverride<RoutePolicy[]>(
      POLICIES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (policies?.length) {
      const request = context.switchToHttp().getRequest<AuthRuntimeRequest>();
      const authUser = requireAuthenticatedAuthUser(request);
      await this.policiesService.assertCanAttemptRoutePoliciesForAuthUser(
        authUser,
        policies,
      );
    }

    return true;
  }
}
