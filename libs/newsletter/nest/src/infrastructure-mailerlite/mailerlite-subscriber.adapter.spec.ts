import { NewsletterSubscriptionService } from '../application/subscription.service';
import { NewsletterUnavailableError } from '../application/newsletter.errors';
import { MailerLiteConfigurationError } from './mailerlite.errors';
import {
  MailerLiteSubscriberAdapter,
  type MailerLiteSubscriberOptions,
} from './mailerlite-subscriber.adapter';

const options: MailerLiteSubscriberOptions = {
  apiKey: 'test-only-key',
  groupId: '123',
  sourceField: 'source',
  retryDelayMs: 10,
};
const request = { email: 'reader@example.test', source: '/articles' };
function setup(overrides: Partial<MailerLiteSubscriberOptions> = {}) {
  const fetcher = jest.fn() as jest.MockedFunction<typeof fetch>;
  const sleep = jest.fn<Promise<void>, [number]>().mockResolvedValue(undefined);
  const adapter = new MailerLiteSubscriberAdapter(
    { ...options, ...overrides },
    { fetch: fetcher, sleep },
  );
  return { adapter, fetcher, sleep };
}

afterEach(() => jest.useRealTimers());

describe('MailerLite subscriber adapter', () => {
  it('requests only unconfirmed status, explicitly forbids resubscribe and returns no provider data', async () => {
    const { adapter, fetcher } = setup();
    fetcher.mockResolvedValue(
      new Response(
        JSON.stringify({ data: { id: 'private', status: 'active' } }),
        { status: 201 },
      ),
    );
    await expect(adapter.subscribe(request)).resolves.toBeUndefined();
    const [url, init] = fetcher.mock.calls[0];
    expect(url).toBe('https://connect.mailerlite.com/api/subscribers');
    expect(init).toMatchObject({
      method: 'POST',
      redirect: 'error',
      headers: {
        Authorization: 'Bearer test-only-key',
        'Content-Type': 'application/json',
        Accept: 'application/json',
      },
    });
    expect(init?.signal).toBeInstanceOf(AbortSignal);
    expect(JSON.parse(String(init?.body))).toEqual({
      email: request.email,
      status: 'unconfirmed',
      resubscribe: false,
      groups: ['123'],
      fields: { source: request.source },
    });
  });

  it.each([200, 201, 202, 204, 422])(
    'treats response %s identically without consuming its payload',
    async (status) => {
      const { adapter, fetcher, sleep } = setup();
      const response = new Response(
        status === 204 ? null : 'private provider detail',
        { status },
      );
      const read = jest.spyOn(response, 'text');
      fetcher.mockResolvedValue(response);
      await expect(adapter.subscribe(request)).resolves.toBeUndefined();
      expect(read).not.toHaveBeenCalled();
      expect(sleep).not.toHaveBeenCalled();
      expect(fetcher).toHaveBeenCalledTimes(1);
    },
  );

  it('omits source unless the host configures an existing custom field', async () => {
    const { adapter, fetcher } = setup({ sourceField: undefined });
    fetcher.mockResolvedValue(new Response(null, { status: 201 }));
    await adapter.subscribe(request);
    expect(
      JSON.parse(String(fetcher.mock.calls[0][1]?.body)),
    ).not.toHaveProperty('fields');
  });

  it.each([400, 401, 403, 404, 409, 301])(
    'does not retry permanent failure %s or expose diagnostics',
    async (status) => {
      const { adapter, fetcher, sleep } = setup();
      fetcher.mockResolvedValue(
        new Response('email and credential detail', { status }),
      );
      const error = await adapter
        .subscribe(request)
        .catch((error: unknown) => error);
      expect(error).toBeInstanceOf(NewsletterUnavailableError);
      expect(error).toMatchObject({
        code: 'subscriber_unavailable',
        retryable: true,
      });
      expect(String(error)).not.toMatch(/credential|reader|test-only-key/);
      expect(error).not.toHaveProperty('cause');
      expect(fetcher).toHaveBeenCalledTimes(1);
      expect(sleep).not.toHaveBeenCalled();
    },
  );

  it.each([408, 429, 500, 502, 503, 504])(
    'retries transient response %s using the same payload',
    async (status) => {
      const { adapter, fetcher, sleep } = setup();
      fetcher
        .mockResolvedValueOnce(new Response(null, { status }))
        .mockResolvedValueOnce(new Response(null, { status: 201 }));
      await adapter.subscribe(request);
      expect(sleep).toHaveBeenCalledWith(10);
      expect(fetcher).toHaveBeenCalledTimes(2);
      expect(fetcher.mock.calls[0][1]?.body).toBe(
        fetcher.mock.calls[1][1]?.body,
      );
    },
  );

  it('bounds exponential backoff and network failure attempts', async () => {
    const { adapter, fetcher, sleep } = setup({ maxAttempts: 3 });
    fetcher.mockRejectedValue(new Error('network credential detail'));
    await expect(adapter.subscribe(request)).rejects.toBeInstanceOf(
      NewsletterUnavailableError,
    );
    expect(fetcher).toHaveBeenCalledTimes(3);
    expect(sleep.mock.calls).toEqual([[10], [20]]);
  });

  it('honors Retry-After seconds and HTTP dates', async () => {
    jest.useFakeTimers().setSystemTime(new Date('2026-10-06T12:00:00Z'));
    const { adapter, fetcher, sleep } = setup({ maxAttempts: 3 });
    fetcher
      .mockResolvedValueOnce(
        new Response(null, { status: 429, headers: { 'Retry-After': '1' } }),
      )
      .mockResolvedValueOnce(
        new Response(null, {
          status: 503,
          headers: { 'Retry-After': 'Tue, 06 Oct 2026 12:00:02 GMT' },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    await adapter.subscribe(request);
    expect(sleep.mock.calls).toEqual([[1000], [2000]]);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('does not shorten a provider Retry-After to fit the configured budget', async () => {
    const { adapter, fetcher, sleep } = setup();
    fetcher.mockResolvedValue(
      new Response(null, { status: 429, headers: { 'Retry-After': '119' } }),
    );
    await expect(adapter.subscribe(request)).rejects.toBeInstanceOf(
      NewsletterUnavailableError,
    );
    expect(fetcher).toHaveBeenCalledTimes(1);
    expect(sleep).not.toHaveBeenCalled();
  });

  it('uses bounded backoff if Retry-After is malformed', async () => {
    const { adapter, fetcher, sleep } = setup();
    fetcher
      .mockResolvedValueOnce(
        new Response(null, {
          status: 429,
          headers: { 'Retry-After': 'invalid' },
        }),
      )
      .mockResolvedValueOnce(new Response(null, { status: 200 }));
    await adapter.subscribe(request);
    expect(sleep).toHaveBeenCalledWith(10);
  });

  it('aborts timed-out calls even when a transport ignores cancellation', async () => {
    jest.useFakeTimers();
    const { adapter, fetcher } = setup({ timeoutMs: 50, maxAttempts: 1 });
    fetcher.mockImplementation(() => new Promise(() => undefined));
    const result = expect(adapter.subscribe(request)).rejects.toBeInstanceOf(
      NewsletterUnavailableError,
    );
    await jest.advanceTimersByTimeAsync(50);
    await result;
    expect(fetcher.mock.calls[0][1]?.signal?.aborted).toBe(true);
    expect(jest.getTimerCount()).toBe(0);
  });

  it('snapshots configuration instead of retaining mutable host options', async () => {
    const mutable = { ...options };
    const fetcher = jest
      .fn()
      .mockResolvedValue(new Response(null, { status: 200 }));
    const adapter = new MailerLiteSubscriberAdapter(mutable, {
      fetch: fetcher,
    });
    mutable.groupId = '999';
    mutable.apiKey = 'changed';
    await adapter.subscribe(request);
    expect(fetcher.mock.calls[0][1].headers.Authorization).toBe(
      'Bearer test-only-key',
    );
    expect(JSON.parse(fetcher.mock.calls[0][1].body).groups).toEqual(['123']);
  });

  it.each([
    { apiKey: '' },
    { apiKey: 'key\n' },
    { groupId: '' },
    { groupId: 'invalid' },
    { groupId: '123\n' },
    { timeoutMs: 0 },
    { timeoutMs: 30001 },
    { maxAttempts: 0 },
    { maxAttempts: 4 },
    { maxAttempts: 1.5 },
    { retryDelayMs: -1 },
    { maxRetryDelayMs: Infinity },
    { sourceField: ' ' },
  ])('fails closed for invalid configuration %j', (overrides) => {
    expect(() => setup(overrides)).toThrow(MailerLiteConfigurationError);
  });

  it('integrates with the consent-first application flow on provider failure and retry', async () => {
    const { adapter, fetcher } = setup({ maxAttempts: 1 });
    const appendGrant = jest.fn(async () => undefined);
    const service = new NewsletterSubscriptionService(
      { appendGrant, appendWithdrawalOnce: async () => 'recorded' },
      adapter,
      { version: 'v1', text: 'Host wording' },
    );
    fetcher.mockImplementation(async () => {
      expect(appendGrant).toHaveBeenCalledTimes(1);
      return new Response(null, { status: 503 });
    });
    const input = { ...request, consent: true, consentVersion: 'v1' };
    await expect(service.subscribe(input)).rejects.toBeInstanceOf(
      NewsletterUnavailableError,
    );
    expect(appendGrant).toHaveBeenCalledTimes(1);
    fetcher.mockResolvedValue(new Response(null, { status: 422 }));
    await expect(service.subscribe(input)).resolves.toEqual({ accepted: true });
    expect(appendGrant).toHaveBeenCalledTimes(2);
  });
});
