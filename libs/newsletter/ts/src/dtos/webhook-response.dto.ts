import { Type, type Static } from '@sinclair/typebox';

/** Aggregate acknowledgement; never returns addresses or provider subscriber state. */
export const NewsletterWebhookResponseSchema = Type.Object(
  {
    recorded: Type.Integer({ minimum: 0 }),
    duplicates: Type.Integer({ minimum: 0 }),
  },
  { additionalProperties: false },
);
export type NewsletterWebhookResponseDTO = Static<
  typeof NewsletterWebhookResponseSchema
>;
// Raw provider bytes must reach signature verification before payload validation.
export const NewsletterWebhookRouteSchema = {
  response: { 200: NewsletterWebhookResponseSchema },
};
