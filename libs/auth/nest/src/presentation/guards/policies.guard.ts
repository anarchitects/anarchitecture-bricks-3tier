import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PoliciesService } from '../../application/services/policies.service';
import { POLICIES_KEY } from '../decorators/policies.decorator';
import { RoutePolicy } from '../route-policy';
import { canAttemptRoutePolicy } from './route-policy-matcher';

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly policiesService: PoliciesService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const policies = this.reflector.getAllAndOverride<RoutePolicy[]>(
      POLICIES_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (policies?.length) {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedException('User not authenticated');
      }

      const policyRules = await this.policiesService.rulesForUser(user);

      for (const policy of policies) {
        if (!canAttemptRoutePolicy(policy, policyRules)) {
          throw new ForbiddenException();
        }
      }
    }

    return true;
  }
}
