import { User } from '@anarchitects/auth-ts/models';
import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PoliciesService } from '../../application/services/policies.service';
import { assertCanAccessResource } from '../../application/services/resource-authorization';
import { AUTH_RESOURCE_AUTHORIZATION_LOADERS } from '../../application/resource-authorization.tokens';
import {
  ResourceAuthorizationLoaders,
  ResourceAuthorizationRoute,
} from '../../application/resource-authorization.types';
import { AUTHORIZE_RESOURCE_KEY } from '../decorators/authorize-resource.decorator';
import { attachAuthorizedResource } from '../authorized-resource.request';

@Injectable()
export class ResourceAuthorizationGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly policiesService: PoliciesService,
    @Inject(AUTH_RESOURCE_AUTHORIZATION_LOADERS)
    private readonly loaders: ResourceAuthorizationLoaders,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      user?: User;
      params?: Record<string, string | undefined>;
    }>();
    const resources =
      this.reflector.getAllAndOverride<ResourceAuthorizationRoute[]>(
        AUTHORIZE_RESOURCE_KEY,
        [context.getHandler(), context.getClass()],
      ) ?? [];

    if (!resources.length) {
      return true;
    }

    const user = request.user;
    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    const ability = await this.policiesService.buildAbilityForUser(user);

    for (const resource of resources) {
      const loader = this.loaders[resource.subject];
      if (!loader) {
        throw new InternalServerErrorException(
          `No resource authorization loader registered for subject "${resource.subject}"`,
        );
      }

      const resourceId = request.params?.[resource.idParam];
      if (!resourceId) {
        throw new BadRequestException(
          `Missing route parameter "${resource.idParam}" for resource authorization`,
        );
      }

      const loadedResource = await loader({ user, resourceId });
      if (!loadedResource) {
        throw new NotFoundException();
      }

      assertCanAccessResource(
        ability,
        resource.action,
        resource.subject,
        loadedResource,
      );
      attachAuthorizedResource(
        request as Record<string, unknown>,
        resource.subject,
        loadedResource,
      );
    }

    return true;
  }
}
