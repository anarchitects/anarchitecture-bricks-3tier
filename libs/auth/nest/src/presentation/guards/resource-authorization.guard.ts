import {
  AUTHORIZE_RESOURCE_KEY,
  ResourceAuthorizationRoute,
} from '@anarchitects/auth-declarations';
import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ResourceAuthorizationService } from '../../application/services/resource-authorization.service';
import { attachAuthorizedResource } from '../authorized-resource.request';
import {
  AuthRuntimeRequest,
  requireAuthenticatedUser,
} from './authenticated-user';
import { isPublicRoute } from './public-route';

@Injectable()
export class ResourceAuthorizationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly resourceAuthorizationService: ResourceAuthorizationService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    if (isPublicRoute(this.reflector, context)) {
      return true;
    }

    const request = context.switchToHttp().getRequest<AuthRuntimeRequest>();
    const resources =
      this.reflector.getAllAndOverride<ResourceAuthorizationRoute[]>(
        AUTHORIZE_RESOURCE_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? [];

    if (!resources.length) {
      return true;
    }

    const user = requireAuthenticatedUser(request);
    const authorizedResources =
      await this.resourceAuthorizationService.authorizeResources({
        user,
        params: request.params,
        resources,
      });
    Object.entries(authorizedResources).forEach(([subject, loadedResource]) =>
      attachAuthorizedResource(
        request as Record<string, unknown>,
        subject,
        loadedResource,
      ),
    );

    return true;
  }
}
