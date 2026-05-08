import {
  BadRequestException,
  Inject,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { AuthUser } from '@anarchitects/auth-ts/models';
import { AUTH_RESOURCE_AUTHORIZATION_LOADERS } from '../resource-authorization.tokens';
import {
  AuthorizableResource,
  ResourceAuthorizationLoaders,
  ResourceAuthorizationRoute,
} from '../resource-authorization.types';
import { PoliciesService } from './policies.service';
import { assertCanAccessResource } from './resource-authorization';

export type ResourceAuthorizationInput = {
  user: AuthUser;
  params?: Record<string, string | undefined>;
  resources: ResourceAuthorizationRoute[];
};

export type AuthorizedResourceMap = Record<string, AuthorizableResource>;

@Injectable()
export class ResourceAuthorizationService {
  constructor(
    private readonly policiesService: PoliciesService,
    @Inject(AUTH_RESOURCE_AUTHORIZATION_LOADERS)
    private readonly loaders: ResourceAuthorizationLoaders,
  ) {}

  async authorizeResources({
    user: authUser,
    params,
    resources,
  }: ResourceAuthorizationInput): Promise<AuthorizedResourceMap> {
    if (!resources.length) {
      return {};
    }

    const ability =
      await this.policiesService.buildAbilityForAuthUser(authUser);
    const authorizedResources: AuthorizedResourceMap = {};

    for (const resource of resources) {
      const loader = this.loaders[resource.subject];
      if (!loader) {
        throw new InternalServerErrorException(
          `No resource authorization loader registered for subject "${resource.subject}"`,
        );
      }

      const resourceId = params?.[resource.idParam];
      if (!resourceId) {
        throw new BadRequestException(
          `Missing route parameter "${resource.idParam}" for resource authorization`,
        );
      }

      const loadedResource = await loader({ user: authUser, resourceId });
      if (!loadedResource) {
        throw new NotFoundException();
      }

      assertCanAccessResource(
        ability,
        resource.action,
        resource.subject,
        loadedResource,
      );
      authorizedResources[resource.subject] = loadedResource;
    }

    return authorizedResources;
  }
}
