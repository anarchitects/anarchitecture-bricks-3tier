import type { Provider } from '@angular/core';
import { provideNewsletterDataAccess } from '@anarchitects/newsletter-angular/data-access';
import { NewsletterStore } from './newsletter.store';

export function provideNewsletterState(): Provider[] {
  return [NewsletterStore];
}

/** Compose state and its default API adapter within the same explicit scope. */
export function provideNewsletterStateWithDataAccess(): Provider[] {
  return [...provideNewsletterDataAccess(), ...provideNewsletterState()];
}
