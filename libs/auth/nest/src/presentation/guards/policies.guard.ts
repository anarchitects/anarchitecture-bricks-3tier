import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PolicyRule } from '@anarchitects/auth-ts/models';
import { PoliciesService } from '../../application/services/policies.service';
import { POLICIES_KEY } from '../decorators/policies.decorator';

@Injectable()
export class PoliciesGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly policiesService: PoliciesService
  ) {}
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const req = context.switchToHttp().getRequest();

    const policies = this.reflector.getAllAndOverride<PolicyRule[]>(
      POLICIES_KEY,
      [context.getHandler(), context.getClass()]
    );
    if (policies) {
      const user = req.user;
      if (!user) {
        throw new UnauthorizedException('User not authenticated');
      }
      const ability = await this.policiesService.buildAbilityForUser(user);
      policies.forEach((policy) => {
        if (!ability.can(policy.action, policy.subject)) {
          throw new ForbiddenException();
        }
      });
    }
    return true;
  }
}
