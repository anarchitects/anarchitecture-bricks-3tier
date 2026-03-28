import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { PolicyRule, User } from '@anarchitects/auth-ts/models';
import { AppAbility, AbilityFactory } from '../factories/ability.factory';
import { AuthUserRepository } from '../ports/auth-user.repository';
import { toValidatedPersistedPolicyRule } from './persisted-policy-rule';

@Injectable()
export class PoliciesService {
  constructor(
    private readonly authUserRepository: AuthUserRepository,
    private readonly abilityFactory: AbilityFactory,
  ) {}

  async rulesForUser(authUser: User): Promise<PolicyRule[]> {
    const user = await this.authUserRepository.findOne({
      where: { id: authUser.id },
      relations: ['roles', 'roles.permissions'],
    });
    if (!user) {
      return [];
    }

    try {
      return (user.roles ?? []).flatMap((role) =>
        (role.permissions ?? []).map((permission) =>
          toValidatedPersistedPolicyRule(permission),
        ),
      );
    } catch (error) {
      throw new InternalServerErrorException(
        `Malformed persisted policy rule payload: ${
          error instanceof Error ? error.message : String(error)
        }`,
      );
    }
  }

  async buildAbilityForUser(authUser: User): Promise<AppAbility> {
    return this.abilityFactory.buildAbility(await this.rulesForUser(authUser));
  }
}
