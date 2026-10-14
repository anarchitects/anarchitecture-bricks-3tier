import type { Static } from '@sinclair/typebox';
import { NewsletterWebhookResponseSchema as CanonicalSchema } from '@anarchitects/newsletter-contracts';
import { canonicalTypeBox } from './canonical-typebox.js';

/** Aggregate acknowledgement; never returns addresses or provider subscriber state. */
export const NewsletterWebhookResponseSchema =
  canonicalTypeBox(CanonicalSchema);
export type NewsletterWebhookResponseDTO = Static<
  typeof NewsletterWebhookResponseSchema
>;
// Raw provider bytes must reach signature verification before payload validation.
export const NewsletterWebhookRouteSchema = {
  response: { 200: NewsletterWebhookResponseSchema },
};
