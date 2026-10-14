import { NewsletterAcceptedResponseSchema as CanonicalSchema } from '@anarchitects/newsletter-contracts';
import type { Static } from '@sinclair/typebox';
import { canonicalTypeBox } from './canonical-typebox.js';

export const NewsletterSubscriptionResponseSchema =
  canonicalTypeBox(CanonicalSchema);
export type NewsletterSubscriptionResponseDTO = Static<
  typeof NewsletterSubscriptionResponseSchema
>;
