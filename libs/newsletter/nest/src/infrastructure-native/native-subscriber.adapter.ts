import type {
  SubscriberPort,
  NewsletterSubscriberRequest,
  NewsletterNativeLifecycleService,
  NewsletterNativeMailPort,
} from '../application';
import { NewsletterConfigurationError } from '../application';

/** Consent must already be committed by NewsletterSubscriptionService before invoking this seam. */
export class NativeSubscriberAdapter implements SubscriberPort {
  constructor(
    private readonly lifecycle: NewsletterNativeLifecycleService,
    private readonly mail: NewsletterNativeMailPort,
  ) {
    if (typeof mail?.sendConfirmation !== 'function')
      throw new NewsletterConfigurationError();
  }
  async subscribe(request: NewsletterSubscriberRequest): Promise<void> {
    const preparation = await this.lifecycle.prepareSubscription(request);
    if (!preparation) return;
    try {
      await this.mail.sendConfirmation(preparation);
    } catch {
      /* Do not reveal membership via a custom mail implementation's failure. */
    }
  }
}
