import { createEnvironmentInjector, EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { provideNewsletter } from './providers';
import { NewsletterStore } from '@anarchitects/newsletter-angular/state';

describe('provideNewsletter facade', () => {
  afterEach(() => TestBed.resetTestingModule());
  it('composes scoped config/client/state over host HTTP and cancels pending HTTP on reset', async () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    const scope = createEnvironmentInjector(
      provideNewsletter({
        consent: { version: 'v1', text: 'Host wording' },
        apiBaseUrl: '/api',
      }),
      TestBed.inject(EnvironmentInjector),
    );
    try {
      const store = scope.get(NewsletterStore);
      const http = TestBed.inject(HttpTestingController);
      const first = store.submit({
        email: 'reader@example.test',
        consent: true,
        consentVersion: store.consent.version,
      });
      const cancelled = http.expectOne('/api/newsletter/subscribe');
      store.reset();
      expect(cancelled.cancelled).toBe(true);
      await first;
      const second = store.submit({
        email: 'reader@example.test',
        consent: true,
        consentVersion: store.consent.version,
      });
      http.expectOne('/api/newsletter/subscribe').flush({ accepted: true });
      await expect(second).resolves.toEqual({ accepted: true });
      expect(store.status()).toBe('success');
      http.verify();
    } finally {
      scope.destroy();
    }
  });
});
