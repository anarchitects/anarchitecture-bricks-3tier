import { FormDefinitionEnvelopeResponseSchema as CanonicalSchema } from '@anarchitects/forms-contracts';
import { canonicalTypeBox } from './canonical-typebox.js';
import type { Static } from '@sinclair/typebox';

export const FormDefinitionEnvelopeResponseSchema =
  canonicalTypeBox(CanonicalSchema);
export type FormDefinitionEnvelopeResponseDTO = Static<
  typeof FormDefinitionEnvelopeResponseSchema
>;
