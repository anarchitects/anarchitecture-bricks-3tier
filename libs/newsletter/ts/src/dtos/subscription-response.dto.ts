import { Type, type Static } from '@sinclair/typebox';

/** Same acknowledgement for new/existing addresses and discarded honeypot submissions. */
export const NewsletterSubscriptionResponseSchema = Type.Object(
  { accepted: Type.Literal(true) },
  { additionalProperties: false },
);

/** Acceptance reveals neither subscriber existence nor double-opt-in/provider status. */
export type NewsletterSubscriptionResponseDTO = Static<
  typeof NewsletterSubscriptionResponseSchema
>;
