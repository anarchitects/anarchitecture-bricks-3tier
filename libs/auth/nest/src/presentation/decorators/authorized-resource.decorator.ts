import {
  InternalServerErrorException,
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';
import { Subject } from '@anarchitects/auth-ts/models';
import { ResourceAuthorizationRoute } from '../../application/resource-authorization.types';
import { AUTHORIZE_RESOURCE_KEY } from './authorize-resource.decorator';
import {
  getAuthorizedResource,
  getAuthorizedResourceStore,
} from '../authorized-resource.request';

const resolveAuthorizedResourceSubject = (
  context: ExecutionContext,
  subjectOverride?: Subject,
): Subject => {
  if (subjectOverride) {
    return subjectOverride;
  }

  const resources =
    Reflect.getMetadata(AUTHORIZE_RESOURCE_KEY, context.getHandler()) ??
    Reflect.getMetadata(AUTHORIZE_RESOURCE_KEY, context.getClass()) ??
    [];

  const subjects = (resources as ResourceAuthorizationRoute[]).map(
    (resource) => resource.subject,
  );

  if (subjects.length === 1) {
    return subjects[0];
  }

  throw new InternalServerErrorException(
    'Authorized resource subject could not be resolved from route metadata',
  );
};

export const AuthorizedResource = createParamDecorator(
  (subjectOverride: Subject | undefined, context: ExecutionContext) => {
    const request = context
      .switchToHttp()
      .getRequest<Record<string, unknown>>();
    const subject = resolveAuthorizedResourceSubject(context, subjectOverride);
    const resource = getAuthorizedResource(request, subject);

    if (resource === undefined) {
      const store = getAuthorizedResourceStore(request);
      throw new InternalServerErrorException(
        `Authorized resource for subject "${subject}" is not attached to the request. Available subjects: ${Object.keys(
          store,
        ).join(', ')}`,
      );
    }

    return resource;
  },
);
