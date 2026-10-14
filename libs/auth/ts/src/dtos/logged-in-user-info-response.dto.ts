import { LoggedInUserInfoResponseSchema as canonical } from '@anarchitects/auth-contracts';
import type { z } from 'zod';
import {
  canonicalTypeBox,
  type CompatibilitySchema,
} from '../contracts/canonical-typebox.js';
import type { PolicyRuleDTO } from './policy-rule.dto.js';

// Opaque JSON remains unknown in the legacy TypeBox-facing API. Canonical
// response validation describes serialized JSON, not the local domain model.
export type LoggedInUserInfoResponseDTO = Omit<
  z.output<typeof canonical>,
  'user' | 'rbac'
> & {
  user: unknown;
  rbac: PolicyRuleDTO[];
};
export const LoggedInUserInfoResponseSchema = canonicalTypeBox(canonical, {
  legacyOpenObject: true,
}) as CompatibilitySchema<LoggedInUserInfoResponseDTO>;
