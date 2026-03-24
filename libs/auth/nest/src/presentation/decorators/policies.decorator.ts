import { applyDecorators, SetMetadata } from '@nestjs/common';
import { RoutePolicy } from '../route-policy';

export const POLICIES_KEY = 'policies';
export const Policies = (...rules: RoutePolicy[]) =>
  applyDecorators(SetMetadata(POLICIES_KEY, rules));
