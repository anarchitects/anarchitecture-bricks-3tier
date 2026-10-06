import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { NewsletterStore } from '@anarchitects/newsletter-angular/state';
import { NewsletterSignup } from '@anarchitects/newsletter-angular/ui';
import type { NewsletterSignupPresentation } from '@anarchitects/newsletter-angular/config';
import type { NewsletterSubscriptionRequestDTO } from '@anarchitects/newsletter-ts/dtos';

@Component({
  selector: 'anarchitects-newsletter-signup-feature',
  imports: [NewsletterSignup],
  templateUrl: './newsletter-signup-feature.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class NewsletterSignupFeature {
  readonly idPrefix = input.required<string>();
  readonly presentation = input.required<NewsletterSignupPresentation>();
  /** Attribution is explicit; never collect location or query strings implicitly. */
  readonly source = input<string>();
  readonly store = inject(NewsletterStore);
  readonly failureMessage = computed(() => {
    const state = this.store.state();
    if (state.status !== 'failure') return '';
    const copy = this.presentation();
    switch (state.code) {
      case 'invalid_request':
        return copy.invalidRequestMessage;
      case 'rate_limited':
        return copy.rateLimitedMessage;
      case 'unavailable':
        return copy.unavailableMessage;
    }
  });
  requestSignup(request: NewsletterSubscriptionRequestDTO): void {
    void this.store.submit({
      ...request,
      ...(this.source() !== undefined ? { source: this.source() } : {}),
    });
  }
}
