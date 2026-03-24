/* eslint-disable @typescript-eslint/no-explicit-any */
import { PolicyRule } from '@anarchitects/auth-ts/models';
import {
  AbilityBuilder,
  createMongoAbility,
  MongoAbility,
} from '@casl/ability';
import { Injectable } from '@nestjs/common';
export type AppAbility = MongoAbility;

@Injectable()
export class AbilityFactory {
  buildAbility(rules: PolicyRule[]): AppAbility {
    const { can, cannot, build } = new AbilityBuilder<AppAbility>(
      createMongoAbility,
    );

    for (const rule of rules) {
      const args: any[] = [rule.action, rule.subject];
      if (rule.fields?.length) {
        args.push(rule.fields);
      }
      if (rule.conditions) {
        args.push(rule.conditions);
      }
      if (rule.inverted) {
        (cannot as any)(...args);
      } else {
        (can as any)(...args);
      }
    }
    return build({
      detectSubjectType: (obj) =>
        (obj as any).__caslSubjectType__ ?? obj?.constructor?.name ?? 'all',
    });
  }
}
