import { NewsletterSubscriptionRequestSchema as CanonicalSchema } from '@anarchitects/newsletter-contracts';
import type { Static } from '@sinclair/typebox';
import { canonicalTypeBox } from './canonical-typebox.js';

export const NewsletterSubscriptionRequestSchema =
  canonicalTypeBox(CanonicalSchema);
export type NewsletterSubscriptionRequestDTO = Static<
  typeof NewsletterSubscriptionRequestSchema
>;
