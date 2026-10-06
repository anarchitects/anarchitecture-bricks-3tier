/** Explicit host-owned subscriber scope. Durations are positive bounded milliseconds. */
export interface NewsletterNativeOptions {
  readonly scope: string;
  /** Default 24 hours. */
  readonly confirmationTtlMs?: number;
  /** Default 30 days. */
  readonly unsubscribeTtlMs?: number;
  /** Default 60 seconds; supplements presentation/gateway abuse controls. */
  readonly resendCooldownMs?: number;
}
