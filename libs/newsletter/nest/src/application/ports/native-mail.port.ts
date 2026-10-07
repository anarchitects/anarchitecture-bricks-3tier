import type { NewsletterNativePreparation } from '../native-lifecycle.service';

/** Newsletter intent only; implementations own delivery, never subscriber state. */
export interface NewsletterNativeMailPort {
  sendConfirmation(preparation: NewsletterNativePreparation): Promise<void>;
  sendUnsubscribed(email: string): Promise<void>;
}
