/* eslint-disable @typescript-eslint/no-explicit-any */
import { Injectable } from '@nestjs/common';
import { AuthUserRepository } from '../../infrastructure-persistence/repositories/auth-user.repository';
import { PolicyRule, User } from '@anarchitects/auth-ts/models';
import { AppAbility, AbilityFactory } from '../factories/ability.factory';

@Injectable()
export class PoliciesService {
  constructor(
    private readonly authUserRepository: AuthUserRepository,
    private readonly abilityFactory: AbilityFactory
  ) {}

  async rulesForUser(authUser: User): Promise<PolicyRule[]> {
    const user = await this.authUserRepository.findOne({
      where: { id: authUser.id },
      relations: ['roles', 'roles.permissions'],
    });
    const inject = (c?: any) =>
      !c ? undefined : JSON.parse(JSON.stringify(c));
    if (!user) {
      return [];
    }
    return (user.roles ?? []).flatMap((role) =>
      (role.permissions ?? []).map<PolicyRule>((permission) => ({
        action: permission.action,
        subject: permission.subject,
        conditions: inject(permission.conditions),
        fields: permission.fields ?? undefined,
        inverted: permission.inverted ?? false,
        reason: permission.reason ?? undefined,
      }))
    );
  }

  async buildAbilityForUser(authUser: User): Promise<AppAbility> {
    return this.abilityFactory.buildAbility(await this.rulesForUser(authUser));
  }
}
