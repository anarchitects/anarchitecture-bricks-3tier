import { Action, Subject } from '@anarchitects/auth-ts/models';
import { subject } from '@casl/ability';
import { ForbiddenException } from '@nestjs/common';
import { AuthorizableResource } from '../../config';
import { AppAbility } from '../factories/ability.factory';

export const toPolicySubject = <T extends AuthorizableResource>(
  subjectType: Subject,
  resource: T,
) => subject(subjectType, resource);

export const assertCanAccessResource = <T extends AuthorizableResource>(
  ability: AppAbility,
  action: Action,
  subjectType: Subject,
  resource: T,
  field?: string,
): void => {
  const policySubject = toPolicySubject(subjectType, resource);
  const isAllowed = field
    ? ability.can(action, policySubject, field)
    : ability.can(action, policySubject);

  if (!isAllowed) {
    throw new ForbiddenException();
  }
};
