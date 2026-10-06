/** Host-owned copy. Plain text only; consent wording remains part of NewsletterConsentPolicy. */
export interface NewsletterSignupPresentation {
  readonly heading: string;
  readonly description?: string;
  readonly emailLabel: string;
  readonly submitLabel: string;
  readonly submittingMessage: string;
  /** Must describe generic acceptance, never assert subscription or confirmation status. */
  readonly successMessage: string;
  readonly invalidEmailMessage: string;
  readonly consentRequiredMessage: string;
  readonly invalidRequestMessage: string;
  readonly rateLimitedMessage: string;
  readonly unavailableMessage: string;
  readonly honeypotLabel: string;
  readonly privacy?: {
    readonly href: string;
    readonly label: string;
    readonly target?: '_self' | '_blank';
  };
}
