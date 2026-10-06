import type {
  NewsletterConsentEvent,
  NewsletterConsentGrantedEvent,
  NewsletterConsentPolicy,
  NewsletterConsentWithdrawnEvent,
  NewsletterWithdrawalEvent,
} from '@anarchitects/newsletter-ts/models';
import {
  CONSENT_REPOSITORY_PORT,
  SUBSCRIBER_PORT,
  NewsletterConfigurationError,
  NewsletterSubscriptionService,
  NewsletterUnavailableError,
  NewsletterValidationError,
  NewsletterWithdrawalService,
  type ConsentRepositoryPort,
  type NewsletterSubscriberRequest,
  type NewsletterWithdrawalOutcome,
  type SubscriberPort,
} from './index';

// Test double only. Production adapters must commit evidence/identity atomically
// in durable storage; this synchronous in-memory section models that contract.
class MemoryConsentRepository implements ConsentRepositoryPort {
  readonly events: NewsletterConsentEvent[] = [];
  private readonly identities = new Set<string>();
  failGrant = false;
  failWithdrawalKey?: string;

  async appendGrant(event: NewsletterConsentGrantedEvent): Promise<void> {
    if (this.failGrant) throw new Error('database details and email');
    this.events.push(event);
  }

  async appendWithdrawalOnce(
    event: NewsletterConsentWithdrawnEvent,
  ): Promise<NewsletterWithdrawalOutcome> {
    if (event.dedupeKey === this.failWithdrawalKey) {
      throw new Error('database details and email');
    }
    const identity = JSON.stringify([event.eventSource, event.dedupeKey]);
    if (this.identities.has(identity)) return 'duplicate';
    this.identities.add(identity);
    this.events.push(event);
    return 'recorded';
  }
}

class FakeSubscriber implements SubscriberPort {
  readonly requests: NewsletterSubscriberRequest[] = [];
  fail = false;
  async subscribe(request: NewsletterSubscriberRequest): Promise<void> {
    this.requests.push(request);
    if (this.fail) throw new Error('provider details, token and email');
  }
}

const policy = {
  version: 'host/v1',
  text: ' Exact host-owned consent wording. ',
};
const request = {
  email: 'Reader+updates@Example.test',
  consent: true,
  consentVersion: policy.version,
  source: '/articles',
};
const now = new Date('2026-10-06T10:00:00.000Z');
const clock = () => now;
const withdrawal: NewsletterWithdrawalEvent = {
  email: request.email,
  eventSource: 'opaque-source/account-A',
  dedupeKey: 'Event-1',
};

function setup() {
  const repository = new MemoryConsentRepository();
  const subscriber = new FakeSubscriber();
  return {
    repository,
    subscriber,
    subscriptions: new NewsletterSubscriptionService(
      repository,
      subscriber,
      policy,
      clock,
    ),
    withdrawals: new NewsletterWithdrawalService(repository, clock),
  };
}

describe('Newsletter subscription application', () => {
  it('records the authoritative policy/context snapshot before requesting double opt-in', async () => {
    const { repository, subscriber, subscriptions } = setup();
    const providerCall = jest
      .spyOn(subscriber, 'subscribe')
      .mockImplementation(async (input) => {
        expect(repository.events).toEqual([
          {
            kind: 'granted',
            email: 'reader+updates@example.test',
            recordedAt: now,
            consentVersion: policy.version,
            consentText: policy.text,
            source: '/articles',
            ipAddress: '192.0.2.1',
          },
        ]);
        expect(input).toEqual({
          email: 'reader+updates@example.test',
          source: '/articles',
        });
      });
    await expect(
      subscriptions.subscribe(request, { ipAddress: '192.0.2.1' }),
    ).resolves.toEqual({ accepted: true });
    expect(providerCall).toHaveBeenCalledTimes(1);
    expect(repository.events[0].recordedAt).not.toBe(now);
  });

  it('waits for grant persistence to complete and snapshots mutable caller data', async () => {
    const { repository, subscriber } = setup();
    let commit!: () => void;
    jest.spyOn(repository, 'appendGrant').mockImplementation(
      (event) =>
        new Promise<void>((resolve) => {
          commit = () => {
            repository.events.push(event);
            resolve();
          };
        }),
    );
    const mutablePolicy = { ...policy };
    const service = new NewsletterSubscriptionService(
      repository,
      subscriber,
      mutablePolicy,
      clock,
    );
    const input = { ...request };
    const context = { ipAddress: '192.0.2.1' };
    const processing = service.subscribe(input, context);
    mutablePolicy.text = 'changed';
    input.email = 'changed@example.test';
    input.source = '/changed';
    context.ipAddress = '192.0.2.2';
    expect(subscriber.requests).toEqual([]);
    commit();
    await processing;
    expect(repository.events[0]).toMatchObject({
      consentText: policy.text,
      ipAddress: '192.0.2.1',
    });
    expect(subscriber.requests).toEqual([
      { email: 'reader+updates@example.test', source: '/articles' },
    ]);
  });

  it('does not call the provider if persistence fails', async () => {
    const { repository, subscriber, subscriptions } = setup();
    repository.failGrant = true;
    await expect(subscriptions.subscribe(request)).rejects.toMatchObject({
      code: 'consent_storage_unavailable',
      retryable: true,
    });
    expect(repository.events).toEqual([]);
    expect(subscriber.requests).toEqual([]);
  });

  it('retains consent after provider failure and permits a separate grant on retry', async () => {
    const { repository, subscriber, subscriptions } = setup();
    subscriber.fail = true;
    const error = await subscriptions
      .subscribe(request)
      .catch((error: unknown) => error);
    expect(error).toBeInstanceOf(NewsletterUnavailableError);
    expect(error).toMatchObject({
      code: 'subscriber_unavailable',
      retryable: true,
    });
    expect(String(error)).not.toContain('token');
    expect(error).not.toHaveProperty('cause');
    expect(repository.events).toHaveLength(1);
    subscriber.fail = false;
    await expect(subscriptions.subscribe(request)).resolves.toEqual({
      accepted: true,
    });
    expect(repository.events).toHaveLength(2);
    expect(subscriber.requests).toHaveLength(2);
  });

  it('acknowledges repeated addresses identically without exposing provider output', async () => {
    const { subscriber, subscriptions } = setup();
    // Even a misbehaving adapter's resolved payload is never returned.
    jest
      .spyOn(subscriber, 'subscribe')
      .mockResolvedValue({ providerId: 'private', confirmed: true } as never);
    await expect(subscriptions.subscribe(request)).resolves.toEqual({
      accepted: true,
    });
    await expect(subscriptions.subscribe(request)).resolves.toEqual({
      accepted: true,
    });
  });

  it.each([
    null,
    {},
    { ...request, consent: false },
    { ...request, consent: 'true' },
    { ...request, consent: 1 },
    { ...request, consent: undefined },
    { ...request, email: 'bad' },
    { ...request, email: 'reader@example.test\n' },
    { ...request, email: ' reader@example.test' },
    { ...request, source: 'x'.repeat(2049) },
    { ...request, website: 42 },
    { ...request, consentText: 'client wording' },
    { ...request, ipAddress: 'spoofed' },
    { ...request, recordedAt: now },
  ])('rejects invalid input without side effects: %j', async (input) => {
    const { subscriptions, repository, subscriber } = setup();
    await expect(subscriptions.subscribe(input)).rejects.toBeInstanceOf(
      NewsletterValidationError,
    );
    expect(repository.events).toEqual([]);
    expect(subscriber.requests).toEqual([]);
  });

  it.each(['old/v0', 'HOST/v1', 'host/v1 '])(
    'requires exact policy version %s',
    async (consentVersion) => {
      const { subscriptions, repository, subscriber } = setup();
      await expect(
        subscriptions.subscribe({ ...request, consentVersion }),
      ).rejects.toMatchObject({ code: 'consent_policy_mismatch' });
      expect(repository.events).toEqual([]);
      expect(subscriber.requests).toEqual([]);
    },
  );

  it.each(['bot', ' ', 'x'.repeat(2049)])(
    'discards honeypots without validation or writes: %s',
    async (website) => {
      const { subscriptions, repository, subscriber } = setup();
      await expect(subscriptions.subscribe({ website })).resolves.toEqual({
        accepted: true,
      });
      expect(repository.events).toEqual([]);
      expect(subscriber.requests).toEqual([]);
    },
  );

  it('allows empty honeypot and omitted optional attribution/context', async () => {
    const { subscriptions, repository, subscriber } = setup();
    await subscriptions.subscribe({
      ...request,
      website: '',
      source: undefined,
    });
    expect(repository.events[0]).not.toHaveProperty('source');
    expect(repository.events[0]).not.toHaveProperty('ipAddress');
    expect(subscriber.requests).toEqual([
      { email: 'reader+updates@example.test' },
    ]);
  });

  it('rejects invalid trusted context without side effects', async () => {
    const { subscriptions, repository, subscriber } = setup();
    await expect(
      subscriptions.subscribe(request, { ipAddress: ' ' }),
    ).rejects.toMatchObject({ code: 'invalid_context' });
    expect(repository.events).toEqual([]);
    expect(subscriber.requests).toEqual([]);
  });

  it.each([
    null,
    { version: '', text: 'wording' },
    { version: 'v1', text: ' ' },
  ])('fails closed for invalid policy configuration %j', (config) => {
    const { repository, subscriber } = setup();
    expect(
      () =>
        new NewsletterSubscriptionService(
          repository,
          subscriber,
          config as NewsletterConsentPolicy,
        ),
    ).toThrow(NewsletterConfigurationError);
  });

  it('rejects an invalid recording clock before effects', async () => {
    const { repository, subscriber } = setup();
    const service = new NewsletterSubscriptionService(
      repository,
      subscriber,
      policy,
      () => new Date(NaN),
    );
    await expect(service.subscribe(request)).rejects.toBeInstanceOf(
      NewsletterConfigurationError,
    );
    expect(repository.events).toEqual([]);
    expect(subscriber.requests).toEqual([]);
  });
});

describe('Newsletter withdrawal application', () => {
  it('records withdrawal without a known grant, invented policy or provider call', async () => {
    const { withdrawals, repository, subscriber } = setup();
    await expect(withdrawals.process([withdrawal])).resolves.toEqual({
      recorded: 1,
      duplicates: 0,
    });
    expect(repository.events).toEqual([
      {
        ...withdrawal,
        email: 'reader+updates@example.test',
        kind: 'withdrawn',
        recordedAt: now,
      },
    ]);
    expect(subscriber.requests).toEqual([]);
  });

  it('appends a withdrawal while leaving the existing grant unchanged', async () => {
    const { withdrawals, subscriptions, repository } = setup();
    await subscriptions.subscribe(request);
    const grant = { ...repository.events[0] };
    await withdrawals.process([withdrawal]);
    expect(repository.events).toHaveLength(2);
    expect(repository.events[0]).toEqual(grant);
  });

  it('delegates concurrent deduplication to shared storage across service instances', async () => {
    const { withdrawals, repository } = setup();
    const secondInstance = new NewsletterWithdrawalService(repository, clock);
    const results = await Promise.all([
      withdrawals.process([withdrawal]),
      secondInstance.process([withdrawal]),
    ]);
    expect(results).toEqual([
      { recorded: 1, duplicates: 0 },
      { recorded: 0, duplicates: 1 },
    ]);
    expect(repository.events).toHaveLength(1);
    await expect(
      withdrawals.process([withdrawal, withdrawal]),
    ).resolves.toEqual({ recorded: 0, duplicates: 2 });
  });

  it('keeps event identities opaque and scoped, without deduplicating by email', async () => {
    const { withdrawals, repository } = setup();
    await expect(
      withdrawals.process([
        withdrawal,
        { ...withdrawal, eventSource: 'opaque-source/account-B' },
        { ...withdrawal, dedupeKey: 'event-1' },
        { ...withdrawal, dedupeKey: ' Event-1 ' },
      ]),
    ).resolves.toEqual({ recorded: 4, duplicates: 0 });
    expect(repository.events).toHaveLength(4);
  });

  it('stops on storage failure and safely retries the whole partially committed batch', async () => {
    const { withdrawals, repository } = setup();
    const batch = [
      withdrawal,
      { ...withdrawal, dedupeKey: 'Event-2' },
      { ...withdrawal, dedupeKey: 'Event-3' },
    ];
    repository.failWithdrawalKey = 'Event-2';
    await expect(withdrawals.process(batch)).rejects.toMatchObject({
      code: 'consent_storage_unavailable',
      retryable: true,
    });
    expect(repository.events).toHaveLength(1);
    repository.failWithdrawalKey = undefined;
    await expect(withdrawals.process(batch)).resolves.toEqual({
      recorded: 2,
      duplicates: 1,
    });
    expect(repository.events).toHaveLength(3);
  });

  it.each([
    null,
    { ...withdrawal, email: 'bad' },
    { ...withdrawal, email: 'x@example.test\n' },
    { ...withdrawal, dedupeKey: '' },
    { ...withdrawal, dedupeKey: 42 },
    { ...withdrawal, eventSource: ' ' },
  ])('validates the entire batch before any writes: %j', async (event) => {
    const { withdrawals, repository } = setup();
    await expect(
      withdrawals.process([withdrawal, event as NewsletterWithdrawalEvent]),
    ).rejects.toMatchObject({ code: 'invalid_withdrawal' });
    expect(repository.events).toEqual([]);
  });

  it('rejects non-arrays and sparse batches, and accepts an empty batch', async () => {
    const { withdrawals, repository } = setup();
    await expect(withdrawals.process(null as never)).rejects.toBeInstanceOf(
      NewsletterValidationError,
    );
    await expect(withdrawals.process(new Array(1))).rejects.toBeInstanceOf(
      NewsletterValidationError,
    );
    await expect(withdrawals.process([])).resolves.toEqual({
      recorded: 0,
      duplicates: 0,
    });
    expect(repository.events).toEqual([]);
  });

  it('snapshots later batch entries before awaiting storage', async () => {
    const { repository, withdrawals } = setup();
    const later = { ...withdrawal, dedupeKey: 'Event-2' };
    const append = repository.appendWithdrawalOnce.bind(repository);
    jest
      .spyOn(repository, 'appendWithdrawalOnce')
      .mockImplementation(async (event) => {
        later.email = 'changed@example.test';
        later.dedupeKey = 'changed';
        return append(event);
      });
    await withdrawals.process([withdrawal, later]);
    expect(repository.events[1]).toMatchObject({
      email: 'reader+updates@example.test',
      dedupeKey: 'Event-2',
    });
  });

  it('does not acknowledge invalid adapter outcomes or expose storage diagnostics', async () => {
    const { repository, withdrawals } = setup();
    jest
      .spyOn(repository, 'appendWithdrawalOnce')
      .mockResolvedValue('unknown' as never);
    const error = await withdrawals
      .process([withdrawal])
      .catch((error: unknown) => error);
    expect(error).toBeInstanceOf(NewsletterUnavailableError);
    expect(error).not.toHaveProperty('cause');
  });
});

it('exports distinct composition tokens without framework registration', () => {
  expect(typeof SUBSCRIBER_PORT).toBe('symbol');
  expect(typeof CONSENT_REPOSITORY_PORT).toBe('symbol');
  expect(SUBSCRIBER_PORT).not.toBe(CONSENT_REPOSITORY_PORT);
});
