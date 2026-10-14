import { FormDefinitionResponseSchema as CanonicalSchema } from '@anarchitects/forms-contracts';
import { canonicalTypeBox } from './canonical-typebox.js';
import type { Static } from '@sinclair/typebox';

export const FormDefinitionResponseSchema = canonicalTypeBox(CanonicalSchema);
export type FormDefinitionResponseDTO = Static<
  typeof FormDefinitionResponseSchema
>;
