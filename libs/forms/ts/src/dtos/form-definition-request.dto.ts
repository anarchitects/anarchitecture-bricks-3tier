import { SubmissionRequestSchema } from '@anarchitects/forms-contracts';
import type { Static } from '@sinclair/typebox';
import { canonicalTypeBox } from './canonical-typebox.js';

export const FormDefinitionRequestSchema = canonicalTypeBox(
  SubmissionRequestSchema.pick({ formId: true, formVersion: true }),
);
export type FormDefinitionRequestDTO = Static<
  typeof FormDefinitionRequestSchema
>;
