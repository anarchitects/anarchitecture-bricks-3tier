export const NEWSLETTER_SCHEMA = 'newsletter';
export const NEWSLETTER_CONSENT_TABLE = 'consent_events';

export const NEWSLETTER_EVENT_IDENTITY_CONSTRAINT =
  'uq_newsletter_consent_event_identity';
export const NEWSLETTER_EVENT_SHAPE_CONSTRAINT =
  'ck_newsletter_consent_event_shape';

/** NULL checks are explicit: PostgreSQL CHECK also permits an unknown result. */
export const NEWSLETTER_EVENT_SHAPE = `
  ("kind" = 'granted'
    AND "consent_version" IS NOT NULL AND btrim("consent_version") <> ''
    AND "consent_text" IS NOT NULL AND btrim("consent_text") <> ''
    AND "event_source" IS NULL AND "dedupe_key" IS NULL)
  OR
  ("kind" = 'withdrawn'
    AND "event_source" IS NOT NULL AND btrim("event_source") <> ''
    AND "dedupe_key" IS NOT NULL AND btrim("dedupe_key") <> ''
    AND "consent_version" IS NULL AND "consent_text" IS NULL
    AND "source" IS NULL AND "ip_address" IS NULL)
`;
