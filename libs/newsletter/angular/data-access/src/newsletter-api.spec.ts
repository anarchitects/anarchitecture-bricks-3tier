import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideNewsletterConfig } from '@anarchitects/newsletter-angular/config';
import type { NewsletterSubscriptionRequestDTO } from '@anarchitects/newsletter-ts/dtos';
import { firstValueFrom } from 'rxjs';
import { NewsletterApi } from './newsletter-api';
import { provideNewsletterDataAccess } from './providers';

const request: NewsletterSubscriptionRequestDTO = {
  email: 'Reader@Example.test',
  consent: true,
  consentVersion: 'shown/v1',
  source: 'footer',
  website: '',
};
const endpoint = 'https://api.example.test/custom/news/subscribe';
describe('NewsletterApi', () => {
  let api: NewsletterApi;
  let http: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        ...provideNewsletterConfig({
          consent: { version: 'configured/v2', text: 'Host wording' },
          apiBaseUrl: 'https://api.example.test/custom/',
          apiResourcePath: '/news/',
          requestTimeoutMs: 500,
        }),
        ...provideNewsletterDataAccess(),
      ],
    });
    api = TestBed.inject(NewsletterApi);
    http = TestBed.inject(HttpTestingController);
  });
  afterEach(() => {
    http.verify();
    TestBed.resetTestingModule();
    vi.useRealTimers();
  });
  it('posts contract fields in JSON, retaining the displayed policy version and honeypot', async () => {
    const input = { ...request, unexpected: 'never sent' };
    const response$ = api.subscribe(input);
    input.email = 'changed@example.test';
    const result = firstValueFrom(response$);
    const pending = http.expectOne(endpoint);
    expect(pending.request.method).toBe('POST');
    expect(pending.request.body).toEqual(request);
    expect(pending.request.urlWithParams).not.toContain(request.email);
    expect(pending.request.withCredentials).toBe(false);
    expect(pending.request.transferCache).toBe(false);
    pending.flush({
      accepted: true,
      subscriberId: 'private',
      status: 'existing',
    });
    await expect(result).resolves.toEqual({ accepted: true });
  });
  it('does not invent consent or retry rejected requests', async () => {
    const result = firstValueFrom(
      api.subscribe({
        ...request,
        consent: false,
      } as unknown as NewsletterSubscriptionRequestDTO),
    );
    const assertion = expect(result).rejects.toMatchObject({
      code: 'invalid_request',
    });
    const pending = http.expectOne(endpoint);
    expect(pending.request.body.consent).toBe(false);
    pending.flush(
      { message: 'existing reader@example.test' },
      { status: 400, statusText: 'Bad Request' },
    );
    await assertion;
    http.expectNone(endpoint);
  });
  it.each([null, {}, { accepted: false }, { accepted: 'true' }])(
    'rejects malformed acknowledgements %j',
    async (response) => {
      const result = firstValueFrom(api.subscribe(request));
      const assertion = expect(result).rejects.toMatchObject({
        code: 'unavailable',
      });
      http.expectOne(endpoint).flush(response);
      await assertion;
    },
  );
  it.each([
    [400, 'invalid_request'],
    [429, 'rate_limited'],
    [401, 'unavailable'],
    [409, 'unavailable'],
    [422, 'unavailable'],
    [503, 'unavailable'],
  ] as const)(
    'maps HTTP %s without exposing provider details',
    async (status, code) => {
      const result = firstValueFrom(api.subscribe(request)).catch(
        (error) => error,
      );
      http.expectOne(endpoint).flush(
        {
          message: 'already subscribed reader@example.test',
          subscriberId: 'private',
        },
        {
          status,
          statusText: 'Private error',
          headers: { 'Retry-After': '30' },
        },
      );
      const error = await result;
      expect(error.code).toBe(code);
      expect(error.message).toBe('Unable to accept the newsletter request.');
      expect(error.cause).toBeUndefined();
      expect(error.error).toBeUndefined();
      expect(error.retryAfterSeconds).toBe(status === 429 ? 30 : undefined);
      expect(JSON.stringify(error)).not.toContain('reader@');
    },
  );
  it.each([
    ['junk', undefined],
    ['-1', undefined],
    ['0', 0],
    ['99999999999999999999', undefined],
    ['Tue, 06 Oct 2026 12:00:10 GMT', 10],
  ])('parses Retry-After safely: %s', async (header, expected) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-10-06T12:00:00Z'));
    const result = firstValueFrom(api.subscribe(request)).catch(
      (error) => error,
    );
    http.expectOne(endpoint).flush(
      {},
      {
        status: 429,
        statusText: 'Limited',
        headers: { 'Retry-After': header },
      },
    );
    expect((await result).retryAfterSeconds).toBe(expected);
  });
  it('maps transport errors to neutral failure', async () => {
    const result = firstValueFrom(api.subscribe(request)).catch(
      (error) => error,
    );
    http.expectOne(endpoint).error(new ProgressEvent('network'));
    expect((await result).code).toBe('unavailable');
  });
  it('bounds waiting without retry and cancels the transport on timeout', async () => {
    vi.useFakeTimers();
    const result = firstValueFrom(api.subscribe(request)).catch(
      (error) => error,
    );
    const pending = http.expectOne(endpoint);
    await vi.advanceTimersByTimeAsync(501);
    expect((await result).code).toBe('unavailable');
    expect(pending.cancelled).toBe(true);
    http.expectNone(endpoint);
  });
});
