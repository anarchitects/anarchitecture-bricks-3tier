import '@angular/compiler';
import { Component } from '@angular/core';
import {
  bootstrapApplication,
  provideClientHydration,
} from '@angular/platform-browser';
import { renderApplication } from '@angular/platform-server';
import { HttpBackend, provideHttpClient } from '@angular/common/http';
import {
  NewsletterSignupFeature,
  provideNewsletter,
} from '@anarchitects/newsletter-angular';
import { writeFileSync } from 'node:fs';

class SsrFixture {
  copy = {
    heading: 'Newsletter',
    emailLabel: 'Email',
    submitLabel: 'Join',
    submittingMessage: 'Sending',
    successMessage: 'Request received',
    invalidEmailMessage: 'Check email',
    consentRequiredMessage: 'Agree first',
    invalidRequestMessage: 'Check details',
    rateLimitedMessage: 'Try later',
    unavailableMessage: 'Try again',
    honeypotLabel: 'Leave empty',
    privacy: { href: '/privacy', label: 'Privacy' },
  };
}
Component({
  selector: 'newsletter-ssr-fixture',
  standalone: true,
  imports: [NewsletterSignupFeature],
  template: `<anarchitects-newsletter-signup-feature idPrefix="header-news" [presentation]="copy" />
    <anarchitects-newsletter-signup-feature idPrefix="footer-news" [presentation]="copy" />`,
})(SsrFixture);
const html = await renderApplication(
  (context) =>
    bootstrapApplication(
      SsrFixture,
      {
        providers: [
          provideClientHydration(),
          provideHttpClient(),
          ...provideNewsletter({
            consent: { version: 'v1', text: 'Receive newsletter updates' },
            apiBaseUrl: '/api',
          }),
          {
            provide: HttpBackend,
            useValue: {
              handle() {
                throw new Error('SSR must not subscribe');
              },
            },
          },
        ],
      },
      context,
    ),
  {
    document:
      '<!doctype html><html><head><title>Newsletter SSR privacy test</title><base href="/"></head><body><newsletter-ssr-fixture></newsletter-ssr-fixture></body></html>',
    url: 'http://localhost/signup',
    allowedHosts: ['localhost'],
  },
);
writeFileSync(process.argv[2], html);
