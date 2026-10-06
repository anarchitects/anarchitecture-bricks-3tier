import type { Provider } from '@angular/core';
import {
  provideNewsletterConfig,
  type NewsletterConfig,
} from '@anarchitects/newsletter-angular/config';
import { provideNewsletterStateWithDataAccess } from '@anarchitects/newsletter-angular/state';

/** Install in a host component or route; separate scopes own independent submission state. */
export function provideNewsletterFeature(config: NewsletterConfig): Provider[] {
  return [
    ...provideNewsletterConfig(config),
    ...provideNewsletterStateWithDataAccess(),
  ];
}
