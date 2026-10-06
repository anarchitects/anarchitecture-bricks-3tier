import type { Provider } from '@angular/core';
import {
  provideNewsletterConfig,
  type NewsletterConfig,
} from '@anarchitects/newsletter-angular/config';
import { provideNewsletterDataAccess } from '@anarchitects/newsletter-angular/data-access';
import { provideNewsletterState } from '@anarchitects/newsletter-angular/state';

/** Easy-mode composition, explicitly scoped wherever the host installs these providers. */
export function provideNewsletter(config: NewsletterConfig): Provider[] {
  return [
    ...provideNewsletterConfig(config),
    ...provideNewsletterDataAccess(),
    ...provideNewsletterState(),
  ];
}
