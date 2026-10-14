import { FormDefinitionQuerySchema as CanonicalSchema } from '@anarchitects/forms-contracts';
import { canonicalTypeBox } from './canonical-typebox.js';
import type { Static } from '@sinclair/typebox';

export const FormDefinitionQuerySchema = canonicalTypeBox(CanonicalSchema);
export type FormDefinitionQueryDTO = Static<typeof FormDefinitionQuerySchema>;
