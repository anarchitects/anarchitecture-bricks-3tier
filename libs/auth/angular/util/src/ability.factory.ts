import { Action, PolicyRule, Subject } from '@anarchitects/auth-ts/models';
import { createMongoAbility, MongoAbility, subject } from '@casl/ability';

type AbilitySubject = Subject | object;

type AbilityResource = Record<string, unknown>;

export type AppAbility = MongoAbility<[Action, AbilitySubject]>;

export const createAppAbility = (rules: PolicyRule[]): AppAbility =>
  createMongoAbility(rules) as AppAbility;

export const asAppAbilitySubject = <TResource extends AbilityResource>(
  subjectName: Subject,
  resource: TResource,
): TResource & { __caslSubjectType__: Subject } =>
  subject(subjectName, resource) as TResource & { __caslSubjectType__: Subject };

export const canAccessResource = <TResource extends AbilityResource>(
  ability: AppAbility | undefined,
  action: Action,
  subjectName: Subject,
  resource: TResource,
): boolean => {
  if (!ability) {
    return false;
  }

  return ability.can(action, asAppAbilitySubject(subjectName, resource));
};

export const canAccessResourceField = <TResource extends AbilityResource>(
  ability: AppAbility | undefined,
  action: Action,
  subjectName: Subject,
  field: string,
  resource: TResource,
): boolean => {
  if (!ability) {
    return false;
  }

  return ability.can(
    action,
    asAppAbilitySubject(subjectName, resource),
    field,
  );
};
