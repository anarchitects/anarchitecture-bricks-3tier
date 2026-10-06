import type {
  SubscriberPort,
  NewsletterSubscriberRequest,
  NewsletterNativeLifecycleService,
} from '../application';

/** Operational core only. #447 adds delivery orchestration; #448 adds native facade/HTTP composition. */
export class NativeSubscriberAdapter implements SubscriberPort {
  constructor(private readonly lifecycle: NewsletterNativeLifecycleService) {}
  async subscribe(request: NewsletterSubscriberRequest): Promise<void> {
    await this.lifecycle.prepareSubscription(request);
  }
}
