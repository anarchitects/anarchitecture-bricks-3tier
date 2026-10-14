import type { Static } from '@sinclair/typebox';
import { NewsletterNativeActionRequestSchema as CanonicalSchema } from '@anarchitects/newsletter-contracts';
import { canonicalTypeBox } from './canonical-typebox.js';
import { NewsletterSubscriptionResponseSchema } from './subscription-response.dto.js';

/** Validate transport shape only; malformed/expired/replayed bearer secrets receive the same acknowledgement. */
export const NewsletterNativeActionRequestSchema =
  canonicalTypeBox(CanonicalSchema);
export type NewsletterNativeActionRequestDTO = Static<
  typeof NewsletterNativeActionRequestSchema
>;
export const NewsletterNativeActionResponseSchema =
  NewsletterSubscriptionResponseSchema;
export type NewsletterNativeActionResponseDTO = Static<
  typeof NewsletterNativeActionResponseSchema
>;
export const NewsletterNativeActionRouteSchema = {
  body: NewsletterNativeActionRequestSchema,
  response: { 202: NewsletterNativeActionResponseSchema },
};
