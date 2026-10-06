import { NewsletterSubscriptionRequestSchema } from './subscription-request.dto';
import { NewsletterSubscriptionResponseSchema } from './subscription-response.dto';

/** Pure Fastify schema fields. Paths, operationId and tags are owned by presentation/spec tooling. */
export const NewsletterSubscriptionRouteSchema = {
  body: NewsletterSubscriptionRequestSchema,
  response: { 202: NewsletterSubscriptionResponseSchema },
};
