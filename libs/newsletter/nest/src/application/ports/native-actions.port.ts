export const NATIVE_NEWSLETTER_ACTIONS = Symbol('newsletter.native-actions');

/** Public application boundary: no token validity, membership, or private mail handoff is returned. */
export interface NewsletterNativeActionsPort {
  confirm(token: unknown): Promise<void>;
  unsubscribe(token: unknown): Promise<void>;
}
