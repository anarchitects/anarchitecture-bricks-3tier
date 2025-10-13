import { Static } from '@sinclair/typebox';
import { schemaFromConfig } from '../builders';

export type SubmissionDTO = Static<ReturnType<typeof schemaFromConfig>>;
