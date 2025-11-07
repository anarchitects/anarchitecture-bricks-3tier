import { PolicyRule } from '@anarchitects/auth-ts/models';
import { applyDecorators, SetMetadata } from '@nestjs/common';

export const POLICIES_KEY = 'policies';
export const Policies = (...rules: PolicyRule[]) =>
  applyDecorators(SetMetadata(POLICIES_KEY, rules));
