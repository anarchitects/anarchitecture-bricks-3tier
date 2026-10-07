import {
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import {
  NewsletterSignupFeature,
  provideNewsletterFeature,
} from '@anarchitects/newsletter-angular/feature';
import type { NewsletterSignupPresentation } from '@anarchitects/newsletter-angular/config';
import type { NewsletterNativeActionResponseDTO } from '@anarchitects/newsletter-ts/dtos';

@Component({
  selector: 'app-root',
  imports: [NewsletterSignupFeature],
  providers: [
    ...provideNewsletterFeature({
      apiBaseUrl: '/api',
      consent: {
        version: 'example/v1',
        text: 'I agree to receive the example newsletter. I can unsubscribe at any time.',
      },
    }),
  ],
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  private readonly http = inject(HttpClient);
  private readonly document = inject(DOCUMENT);
  private readonly url = new URL(
    this.document.location?.href ?? 'https://example.test',
  );
  readonly action =
    this.url.pathname === '/confirm'
      ? 'confirm'
      : this.url.pathname === '/unsubscribe'
        ? 'unsubscribe'
        : null;
  private readonly token = this.url.searchParams.get('token') ?? '';
  readonly pending = signal(false);
  readonly accepted = signal(false);
  readonly failed = signal(false);
  readonly presentation: NewsletterSignupPresentation = {
    heading: 'Stay in touch',
    description: 'Occasional updates from our example publication.',
    emailLabel: 'Email address',
    submitLabel: 'Request signup',
    submittingMessage: 'Sending your request…',
    successMessage: 'Request received. Check your inbox for any next steps.',
    invalidEmailMessage: 'Enter a valid email address.',
    consentRequiredMessage: 'Please agree before continuing.',
    invalidRequestMessage: 'Check your details and try again.',
    rateLimitedMessage: 'Please wait before trying again.',
    unavailableMessage:
      'We could not process your request. Please try again later.',
    honeypotLabel: 'Leave this field empty',
    privacy: { href: '#privacy', label: 'Example privacy information' },
  };
  constructor() {
    // Capture once, then remove bearer tokens from the address bar before interaction.
    if (this.action)
      this.document.defaultView?.history.replaceState(
        null,
        '',
        this.url.pathname,
      );
  }
  submitAction(): void {
    if (!this.action || this.pending() || this.accepted()) return;
    this.pending.set(true);
    this.failed.set(false);
    this.http
      .post<NewsletterNativeActionResponseDTO>(
        `/api/newsletter/${this.action}`,
        { token: this.token },
      )
      .subscribe({
        next: () => {
          this.accepted.set(true);
          this.pending.set(false);
        },
        error: () => {
          this.failed.set(true);
          this.pending.set(false);
        },
      });
  }
}
