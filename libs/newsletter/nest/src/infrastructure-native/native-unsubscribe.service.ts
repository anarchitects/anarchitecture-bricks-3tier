import type {
  NewsletterNativeLifecycleService,
  NewsletterNativeMailPort,
} from '../application';
import { NewsletterConfigurationError } from '../application';

/** Withdraws atomically, then attempts a receipt. Public result is always neutral. */
export class NativeUnsubscribeService {
  constructor(
    private readonly lifecycle: NewsletterNativeLifecycleService,
    private readonly mail: NewsletterNativeMailPort,
  ) {
    if (typeof mail?.sendUnsubscribed !== 'function')
      throw new NewsletterConfigurationError();
  }
  async unsubscribe(secret: unknown): Promise<void> {
    const notification =
      await this.lifecycle.unsubscribeAndPrepareNotification(secret);
    if (!notification) return;
    try {
      await this.mail.sendUnsubscribed(notification.email);
    } catch {
      /* A receipt failure cannot undo withdrawal or disclose token validity. */
    }
  }
}
