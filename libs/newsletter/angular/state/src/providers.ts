import type { Provider } from '@angular/core';
import { NewsletterStore } from './newsletter.store';

export function provideNewsletterState(): Provider[] {
  return [NewsletterStore];
}
