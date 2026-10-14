import {
  PublicFormDefinitionResponseSchema as CanonicalConfig,
  PublicFormDefinitionEnvelopeResponseSchema as CanonicalEnvelope,
  FormDeliveryStatusSchema as CanonicalDeliveryStatus,
} from '@anarchitects/forms-contracts';
import type { Static } from '@sinclair/typebox';
import { canonicalTypeBox } from './canonical-typebox.js';

export const PublicFormDefinitionResponseSchema = canonicalTypeBox(
  CanonicalConfig,
  true,
);
export type PublicFormDefinitionResponseDTO = Static<
  typeof PublicFormDefinitionResponseSchema
>;
export const PublicFormDefinitionEnvelopeResponseSchema = canonicalTypeBox(
  CanonicalEnvelope,
  true,
);
export type PublicFormDefinitionEnvelopeResponseDTO = Static<
  typeof PublicFormDefinitionEnvelopeResponseSchema
>;
export const FormDeliveryStatusSchema = canonicalTypeBox(
  CanonicalDeliveryStatus,
  true,
);
export type FormDeliveryStatusDTO = Static<typeof FormDeliveryStatusSchema>;
