import { FormIdParamsSchema as CanonicalSchema } from '@anarchitects/forms-contracts';
import { canonicalTypeBox } from './canonical-typebox.js';
import type { Static } from '@sinclair/typebox';

export const FormIdParamsSchema = canonicalTypeBox(CanonicalSchema);
export type FormIdParamsDTO = Static<typeof FormIdParamsSchema>;
