import { Action, PolicyRule, Subject } from '@anarchitects/auth-ts/models';
import { createMongoAbility, MongoAbility } from '@casl/ability';

type AbilitySubject =
  | Subject
  | (Record<string, unknown> & { __caslSubjectType__?: Subject });

export type AppAbility = MongoAbility<
  [Action, AbilitySubject],
  { conditions: Record<string, unknown> }
>;

export const createAppAbility = (rules: PolicyRule[]) =>
  createMongoAbility(rules);
