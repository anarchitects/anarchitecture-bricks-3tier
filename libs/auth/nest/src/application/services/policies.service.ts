import {
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
} from '@nestjs/common';
import {
  AuthUser,
  canAttemptRoutePolicy,
  PolicyRule,
  RoutePolicy,
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

  async rulesForAuthUser(authUser: AuthUser): Promise<PolicyRule[]> {
    const loadedAuthUser = await this.authUserRepository.findOne({
      where: { id: authUser.id },
      relations: { roles: { permissions: true } },
    });
    if (!loadedAuthUser) {
      return [];
    }

    return this.rulesForLoadedAuthUser(loadedAuthUser);
  }

  async rulesForUser(authUser: AuthUser): Promise<PolicyRule[]> {
    return this.rulesForAuthUser(authUser);
  }

  rulesForLoadedAuthUser(authUser: AuthUser): PolicyRule[] {
    try {
      return (authUser.roles ?? []).flatMap((role) =>
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

  rulesForLoadedUser(authUser: AuthUser): PolicyRule[] {
    return this.rulesForLoadedAuthUser(authUser);
  }

  async buildAbilityForAuthUser(authUser: AuthUser): Promise<AppAbility> {
    return this.abilityFactory.buildAbility(
      await this.rulesForAuthUser(authUser),
    );
  }

  async buildAbilityForUser(authUser: AuthUser): Promise<AppAbility> {
    return this.buildAbilityForAuthUser(authUser);
  }

  async canAttemptRoutePoliciesForAuthUser(
    authUser: AuthUser,
    routePolicies: RoutePolicy[],
  ): Promise<boolean> {
    if (!routePolicies.length) {
      return true;
    }

    const policyRules = await this.rulesForAuthUser(authUser);
    return routePolicies.every((routePolicy) =>
      canAttemptRoutePolicy(routePolicy, policyRules),
    );
  }

  async canAttemptRoutePolicies(
    authUser: AuthUser,
    routePolicies: RoutePolicy[],
  ): Promise<boolean> {
    return this.canAttemptRoutePoliciesForAuthUser(authUser, routePolicies);
  }

  async assertCanAttemptRoutePoliciesForAuthUser(
    authUser: AuthUser,
    routePolicies: RoutePolicy[],
  ): Promise<void> {
    const canAttempt = await this.canAttemptRoutePoliciesForAuthUser(
      authUser,
      routePolicies,
    );
    if (!canAttempt) {
      throw new ForbiddenException();
    }
  }

  async assertCanAttemptRoutePolicies(
    authUser: AuthUser,
    routePolicies: RoutePolicy[],
  ): Promise<void> {
    return this.assertCanAttemptRoutePoliciesForAuthUser(
      authUser,
      routePolicies,
    );
  }
}
