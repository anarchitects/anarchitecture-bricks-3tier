import { applyDecorators, SetMetadata, UseGuards } from '@nestjs/common';
import { ResourceAuthorizationRoute } from '../../application/resource-authorization.types';
import { ResourceAuthorizationGuard } from '../guards/resource-authorization.guard';

export const AUTHORIZE_RESOURCE_KEY = 'authorize-resource';

export const AuthorizeResource = (...resources: ResourceAuthorizationRoute[]) =>
  applyDecorators(
    SetMetadata(AUTHORIZE_RESOURCE_KEY, resources),
    UseGuards(ResourceAuthorizationGuard),
  );
