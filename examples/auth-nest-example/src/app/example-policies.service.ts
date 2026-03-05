import { PolicyRule } from '@anarchitects/auth-ts/models';
import { createMongoAbility } from '@casl/ability';
import { Injectable } from '@nestjs/common';

type PolicyAwareUser = {
  rbac?: PolicyRule[];
};

@Injectable()
export class ExamplePoliciesService {
  async buildAbilityForUser(authUser: PolicyAwareUser) {
    return createMongoAbility(authUser?.rbac ?? []);
  }
}
