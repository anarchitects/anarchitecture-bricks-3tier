import { POLICIES_KEY, RoutePolicy } from '@anarchitects/auth-declarations';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PoliciesService } from '../../application/services/policies.service';
import {
  AuthRuntimeRequest,
  requireAuthenticatedUser,
} from './authenticated-user';

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly policiesService: PoliciesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const policies = this.reflector.getAllAndOverride<RoutePolicy[]>(
      POLICIES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (policies?.length) {
      const request = context.switchToHttp().getRequest<AuthRuntimeRequest>();
      const user = requireAuthenticatedUser(request);
      await this.policiesService.assertCanAttemptRoutePolicies(user, policies);
    }

    return true;
  }
}
