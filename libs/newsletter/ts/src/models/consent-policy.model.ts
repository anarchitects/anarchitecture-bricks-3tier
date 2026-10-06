/** Host-owned wording and its opaque version, shared by frontend and backend configuration. */
export interface NewsletterConsentPolicy {
  /** Non-blank identifier. Changing the wording requires a new host-managed version. */
  readonly version: string;
  /** Exact wording shown to the subscriber; the server uses its own configured copy. */
  readonly text: string;
}
