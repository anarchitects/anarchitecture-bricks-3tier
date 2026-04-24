import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  canAttemptRoutePolicy,
  PolicyRule,
  RoutePolicy,
  User,
} from '@anarchitects/auth-ts/models';
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

    return this.rulesForLoadedUser(user);
  }

  rulesForLoadedUser(user: User): PolicyRule[] {
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

  async canAttemptRoutePolicies(
    authUser: User,
    routePolicies: RoutePolicy[],
  ): Promise<boolean> {
    if (!routePolicies.length) {
      return true;
    }

    const policyRules = await this.rulesForUser(authUser);
    return routePolicies.every((routePolicy) =>
      canAttemptRoutePolicy(routePolicy, policyRules),
    );
  }

  async assertCanAttemptRoutePolicies(
    authUser: User,
    routePolicies: RoutePolicy[],
  ): Promise<void> {
    const canAttempt = await this.canAttemptRoutePolicies(
      authUser,
      routePolicies,
    );
    if (!canAttempt) {
      throw new ForbiddenException();
    }
  }
}
