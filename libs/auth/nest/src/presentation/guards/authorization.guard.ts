import {
  AUTHORIZE_RESOURCE_KEY,
  POLICIES_KEY,
  ResourceAuthorizationRoute,
  RoutePolicy,
} from '@anarchitects/auth-declarations';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PoliciesService } from '../../application/services/policies.service';
import { ResourceAuthorizationService } from '../../application/services/resource-authorization.service';
import { attachAuthorizedResource } from '../authorized-resource.request';
import {
  AuthRuntimeRequest,
  requireAuthenticatedUser,
} from './authenticated-user';
import { isPublicRoute } from './public-route';

@Injectable()
export class AuthorizationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly policiesService: PoliciesService,
    private readonly resourceAuthorizationService: ResourceAuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (isPublicRoute(this.reflector, context)) {
      return true;
    }

    const targets = [context.getHandler(), context.getClass()];
    const policies =
      this.reflector.getAllAndOverride<RoutePolicy[]>(POLICIES_KEY, targets) ??
      [];
    const resources =
      this.reflector.getAllAndOverride<ResourceAuthorizationRoute[]>(
        AUTHORIZE_RESOURCE_KEY,
        targets,
      ) ?? [];

    if (!policies.length && !resources.length) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthRuntimeRequest>();
    const user = requireAuthenticatedUser(request);

    await this.policiesService.assertCanAttemptRoutePolicies(user, policies);

    const authorizedResources =
      await this.resourceAuthorizationService.authorizeResources({
        user,
        params: request.params,
        resources,
      });
    Object.entries(authorizedResources).forEach(([subject, resource]) =>
      attachAuthorizedResource(
        request as unknown as Record<string, unknown>,
        subject,
        resource,
      ),
    );

    return true;
  }
}
