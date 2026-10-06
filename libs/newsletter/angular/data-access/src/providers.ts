import type { Provider } from '@angular/core';
import { NewsletterApi } from './newsletter-api';

/** HttpClient is configured once by the host. */
export function provideNewsletterDataAccess(): Provider[] {
  return [NewsletterApi];
}
