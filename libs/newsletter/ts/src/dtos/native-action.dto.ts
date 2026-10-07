import { Type, type Static } from '@sinclair/typebox';
import { NewsletterSubscriptionResponseSchema } from './subscription-response.dto';

/** Validate transport shape only; malformed/expired/replayed bearer secrets receive the same acknowledgement. */
export const NewsletterNativeActionRequestSchema = Type.Object(
  { token: Type.String({ maxLength: 128 }) },
  { additionalProperties: false },
);
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
