import { Type, type Static } from '@sinclair/typebox';

/** Structural validation only: policy-version matching and honeypot handling belong to the server. */
export const NewsletterSubscriptionRequestSchema = Type.Object(
  {
    email: Type.String({
      maxLength: 254,
      // Intentionally permissive syntax; confirmation determines ownership.
      // A pattern keeps TypeBox Value and JSON Schema consumers independent of format registries.
      pattern: '^[^\\s@]+@[^\\s@]+\\.[^\\s@]+(?![\\s\\S])',
    }),
    consent: Type.Literal(true),
    consentVersion: Type.String({ minLength: 1, pattern: '\\S' }),
    source: Type.Optional(Type.String({ maxLength: 2048 })),
    /** Honeypot input. Non-empty values must never cause subscription side effects. */
    website: Type.Optional(Type.String({ maxLength: 2048 })),
  },
  { additionalProperties: false },
);

export type NewsletterSubscriptionRequestDTO = Static<
  typeof NewsletterSubscriptionRequestSchema
>;
