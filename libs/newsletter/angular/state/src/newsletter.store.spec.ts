import { createEnvironmentInjector, EnvironmentInjector } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideNewsletterConfig } from '@anarchitects/newsletter-angular/config';
import {
  NewsletterApi,
  NewsletterApiError,
} from '@anarchitects/newsletter-angular/data-access';
import type {
  NewsletterSubscriptionRequestDTO,
  NewsletterSubscriptionResponseDTO,
} from '@anarchitects/newsletter-ts/dtos';
import { EMPTY, of, Subject, throwError } from 'rxjs';
import { provideNewsletterState } from './providers';
import { NewsletterStore } from './newsletter.store';

const request: NewsletterSubscriptionRequestDTO = {
  email: 'reader@example.test',
  consent: true,
  consentVersion: 'v1',
};
const consent = { version: 'v1', text: 'Host wording' };
describe('NewsletterStore', () => {
  const api = { subscribe: vi.fn() };
  let store: NewsletterStore;
  beforeEach(() => {
    api.subscribe.mockReset();
    TestBed.configureTestingModule({
      providers: [
        ...provideNewsletterConfig({ consent }),
        { provide: NewsletterApi, useValue: api },
        ...provideNewsletterState(),
      ],
    });
    store = TestBed.inject(NewsletterStore);
  });
  afterEach(() => TestBed.resetTestingModule());
  it('exposes host policy and transitions idle → submitting → neutral success', async () => {
    expect(store.state()).toEqual({ status: 'idle' });
    expect(store.consent).toEqual(consent);
    const response = new Subject<NewsletterSubscriptionResponseDTO>();
    api.subscribe.mockReturnValue(response);
    const result = store.submit(request);
    expect(store.submitting()).toBe(true);
    expect(store.state()).toEqual({ status: 'submitting' });
    response.next({ accepted: true });
    await expect(result).resolves.toEqual({ accepted: true });
    expect(store.state()).toEqual({ status: 'success' });
    expect(store.submitting()).toBe(false);
    expect(api.subscribe).toHaveBeenCalledWith(request);
    expect(JSON.stringify(store.state())).not.toContain('reader@');
  });
  it.each(['invalid_request', 'rate_limited', 'unavailable'] as const)(
    'exposes safe %s metadata and clears failure when retrying',
    async (code) => {
      api.subscribe.mockReturnValueOnce(
        throwError(
          () =>
            new NewsletterApiError(
              code,
              code === 'rate_limited' ? 15 : undefined,
            ),
        ),
      );
      await expect(store.submit(request)).resolves.toBeUndefined();
      expect(store.state()).toEqual({
        status: 'failure',
        code,
        ...(code === 'rate_limited' ? { retryAfterSeconds: 15 } : {}),
      });
      const response = new Subject<NewsletterSubscriptionResponseDTO>();
      api.subscribe.mockReturnValueOnce(response);
      const retry = store.submit(request);
      expect(store.state()).toEqual({ status: 'submitting' });
      response.next({ accepted: true });
      await retry;
      expect(store.status()).toBe('success');
    },
  );
  it('contains unexpected errors from replaced clients', async () => {
    const logger = vi.spyOn(console, 'error');
    api.subscribe.mockImplementation(() => {
      throw new Error('already exists reader@example.test');
    });
    await expect(store.submit(request)).resolves.toBeUndefined();
    expect(store.state()).toEqual({ status: 'failure', code: 'unavailable' });
    expect(logger).not.toHaveBeenCalled();
    logger.mockRestore();
  });
  it('does not report empty completion as success', async () => {
    api.subscribe.mockReturnValue(EMPTY);
    await store.submit(request);
    expect(store.state()).toEqual({ status: 'failure', code: 'unavailable' });
  });
  it('ignores overlapping submissions rather than duplicating consent writes', async () => {
    const response = new Subject<NewsletterSubscriptionResponseDTO>();
    api.subscribe.mockReturnValue(response);
    const first = store.submit(request);
    await expect(
      store.submit({ ...request, email: 'second@example.test' }),
    ).resolves.toBeUndefined();
    expect(api.subscribe).toHaveBeenCalledTimes(1);
    expect(store.submitting()).toBe(true);
    response.next({ accepted: true });
    await first;
  });
  it('reset unsubscribes and prevents a cancelled attempt from replacing newer state', async () => {
    const firstResponse = new Subject<NewsletterSubscriptionResponseDTO>();
    const secondResponse = new Subject<NewsletterSubscriptionResponseDTO>();
    api.subscribe
      .mockReturnValueOnce(firstResponse)
      .mockReturnValueOnce(secondResponse);
    const first = store.submit(request);
    expect(firstResponse.observed).toBe(true);
    store.reset();
    expect(firstResponse.observed).toBe(false);
    expect(store.status()).toBe('idle');
    const second = store.submit(request);
    firstResponse.next({ accepted: true });
    await expect(first).resolves.toBeUndefined();
    expect(store.status()).toBe('submitting');
    secondResponse.next({ accepted: true });
    await second;
    expect(store.status()).toBe('success');
    store.reset();
    expect(store.state()).toEqual({ status: 'idle' });
  });
  it('isolates explicitly provided state in sibling injectors and cancels on destruction', async () => {
    const parent = TestBed.inject(EnvironmentInjector);
    const first = createEnvironmentInjector(provideNewsletterState(), parent);
    const second = createEnvironmentInjector(provideNewsletterState(), parent);
    try {
      const a = first.get(NewsletterStore),
        b = second.get(NewsletterStore);
      expect(a).not.toBe(b);
      expect(a).not.toBe(store);
      const response = new Subject<NewsletterSubscriptionResponseDTO>();
      api.subscribe.mockReturnValue(response);
      const pending = a.submit(request);
      expect(b.status()).toBe('idle');
      first.destroy();
      expect(response.observed).toBe(false);
      await expect(pending).resolves.toBeUndefined();
      expect(a.status()).toBe('idle');
      await a.submit(request);
      expect(api.subscribe).toHaveBeenCalledTimes(1);
    } finally {
      if (!first.destroyed) first.destroy();
      second.destroy();
    }
  });
  it('does not register global singleton state', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        ...provideNewsletterConfig({ consent }),
        { provide: NewsletterApi, useValue: api },
      ],
    });
    expect(() => TestBed.inject(NewsletterStore)).toThrow();
  });
  it('uses identical state for repeated accepted addresses', async () => {
    api.subscribe.mockReturnValue(of({ accepted: true }));
    await store.submit(request);
    const first = store.state();
    await store.submit(request);
    expect(store.state()).toEqual(first);
    expect(store.state()).toEqual({ status: 'success' });
  });
});
