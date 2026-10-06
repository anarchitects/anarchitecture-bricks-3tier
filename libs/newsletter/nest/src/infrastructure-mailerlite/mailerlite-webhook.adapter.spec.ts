import { createHmac } from 'node:crypto';
import type { NewsletterConsentWithdrawnEvent } from '@anarchitects/newsletter-ts/models';
import { NewsletterWithdrawalService } from '../application/withdrawal.service';
import { NewsletterUnavailableError } from '../application/newsletter.errors';
import {
  MailerLiteWebhookAdapter,
  type MailerLiteWebhookOptions,
} from './mailerlite-webhook.adapter';
import {
  MailerLiteConfigurationError,
  MailerLiteWebhookError,
} from './mailerlite.errors';

const options: MailerLiteWebhookOptions = {
  webhookSecret: 'test-only-webhook-secret',
  accountId: '123',
};
const flat = {
  event: 'subscriber.unsubscribed',
  account_id: 123,
  id: '100000000000000000',
  email: 'Reader@Example.test',
  unsubscribed_at: '2026-10-06T12:00:00.123456Z',
  updated_at: '2026-10-06T12:00:00.123456Z',
};
const nested = {
  type: 'subscriber.deleted',
  account_id: 123,
  subscriber: {
    id: flat.id,
    email: flat.email,
    deleted_at: flat.updated_at,
    updated_at: flat.updated_at,
  },
};
function sign(bytes: Uint8Array, secret = options.webhookSecret) {
  return createHmac('sha256', secret).update(bytes).digest('hex');
}
function body(payload: unknown) {
  return Buffer.from(JSON.stringify(payload));
}
function setup(overrides: Partial<MailerLiteWebhookOptions> = {}) {
  const process = jest.fn(async () => ({ recorded: 1, duplicates: 0 }));
  const adapter = new MailerLiteWebhookAdapter(
    { ...options, ...overrides },
    { process },
  );
  const receive = (payload: unknown) => {
    const bytes = body(payload);
    return adapter.receive(bytes, sign(bytes));
  };
  return { adapter, process, receive };
}

describe('MailerLite signed webhook adapter', () => {
  it('verifies raw bytes and dispatches a neutral withdrawal without provider fields', async () => {
    const { adapter, process } = setup();
    const bytes = Buffer.from(JSON.stringify(flat, null, 2) + '\n');
    await expect(
      adapter.receive(bytes, sign(bytes).toUpperCase()),
    ).resolves.toEqual({ recorded: 1, duplicates: 0 });
    expect(process).toHaveBeenCalledWith([
      {
        email: 'reader@example.test',
        eventSource: 'mailerlite:123',
        dedupeKey: expect.stringMatching(/^v1:[a-f0-9]{64}$/),
      },
    ]);
  });

  it.each([
    undefined,
    null,
    '',
    'not-hex',
    'a'.repeat(63),
    'a'.repeat(65),
    ['a'.repeat(64)],
    'a'.repeat(64) + 'zz',
  ])(
    'rejects malformed or missing signature %j before dispatch',
    async (signature) => {
      const { adapter, process } = setup();
      await expect(
        adapter.receive(body(flat), signature),
      ).rejects.toMatchObject({ code: 'invalid_signature' });
      expect(process).not.toHaveBeenCalled();
    },
  );

  it('rejects a wrong secret, tampered bytes and a signature over reserialized JSON', async () => {
    const { adapter, process } = setup();
    const bytes = Buffer.from(JSON.stringify(flat, null, 2));
    for (const signature of [
      sign(bytes, 'wrong-secret'),
      sign(body(flat)),
      sign(Buffer.from('tampered')),
      sign(bytes) + '\n',
      sign(bytes) + 'zz',
    ]) {
      await expect(adapter.receive(bytes, signature)).rejects.toBeInstanceOf(
        MailerLiteWebhookError,
      );
    }
    expect(process).not.toHaveBeenCalled();
  });

  it('checks signature before trying to parse invalid JSON', async () => {
    const { adapter, process } = setup();
    const bytes = Buffer.from('{broken');
    await expect(adapter.receive(bytes, '0'.repeat(64))).rejects.toMatchObject({
      code: 'invalid_signature',
    });
    await expect(adapter.receive(bytes, sign(bytes))).rejects.toMatchObject({
      code: 'invalid_payload',
    });
    expect(process).not.toHaveBeenCalled();
  });

  it.each([undefined, {}, '{"event":"subscriber.deleted"}'])(
    'requires captured raw bytes, not a parsed body/string %j',
    async (rawBody) => {
      const { adapter, process } = setup();
      await expect(
        adapter.receive(rawBody as never, '0'.repeat(64)),
      ).rejects.toMatchObject({ code: 'missing_raw_body' });
      expect(process).not.toHaveBeenCalled();
    },
  );

  it('rejects signed invalid UTF-8', async () => {
    const { adapter, process } = setup();
    const bytes = Buffer.from([0xff]);
    await expect(adapter.receive(bytes, sign(bytes))).rejects.toMatchObject({
      code: 'invalid_payload',
    });
    expect(process).not.toHaveBeenCalled();
  });

  it('normalizes flat/nested batches and ignores named events unrelated to withdrawal', async () => {
    const { receive, process } = setup();
    await receive({
      events: [
        flat,
        nested,
        { event: 'subscriber.created' },
        { type: 'campaign.sent' },
      ],
    });
    const [events] = process.mock.calls[0] as unknown as [
      Array<{ dedupeKey: string }>,
    ];
    expect(events).toHaveLength(2);
    expect(events[0].dedupeKey).not.toBe(events[1].dedupeKey);
  });

  it('accepts an empty batch and a signed unrelated event without evidence', async () => {
    const { receive, process } = setup();
    await receive({ events: [] });
    await receive({ type: 'subscriber.updated' });
    expect(process.mock.calls).toEqual([[[]], [[]]]);
  });

  it('keeps keys stable across envelope, field ordering and irrelevant payload changes', async () => {
    const { receive, process } = setup();
    await receive(flat);
    await receive({
      events: [
        {
          type: flat.event,
          account_id: '123',
          subscriber: {
            ...flat,
            email: flat.email.toLowerCase(),
            fields: { name: 'Changed' },
          },
        },
      ],
    });
    expect(process.mock.calls[0]).toEqual(process.mock.calls[1]);
  });

  it('distinguishes repeated events by occurrence time, subscriber and account', async () => {
    const one = setup();
    await one.receive(flat);
    await one.receive({
      ...flat,
      unsubscribed_at: '2026-10-06T12:00:00.123457Z',
    });
    await one.receive({ ...flat, id: '100000000000000001' });
    const events = one.process.mock.calls.map(
      (call) => (call as unknown as [[{ dedupeKey: string }]])[0][0],
    );
    expect(new Set(events.map((event) => event.dedupeKey)).size).toBe(3);
    const two = setup({ accountId: '456' });
    await two.receive({ ...flat, account_id: 456 });
    expect(two.process.mock.calls[0]).not.toEqual(one.process.mock.calls[0]);
  });

  it('uses documented updated_at when occurrence-specific time is absent', async () => {
    const { receive, process } = setup();
    await receive({ ...flat, unsubscribed_at: null });
    await receive({
      ...nested,
      subscriber: { ...nested.subscriber, deleted_at: null },
    });
    expect(process).toHaveBeenCalledTimes(2);
  });

  it.each([
    null,
    [],
    {},
    { events: {} },
    { events: [null] },
    { ...flat, email: 'invalid' },
    { ...flat, id: undefined },
    { ...flat, id: 100000000000000000 },
    { ...flat, unsubscribed_at: null, updated_at: undefined },
    { ...flat, unsubscribed_at: 'not-a-timestamp' },
    { ...flat, type: 'subscriber.deleted' },
    { ...flat, account_id: 999 },
    { ...nested, subscriber: null },
    { events: [flat], account_id: 999 },
  ])(
    'rejects malformed signed input without accepting events: %j',
    async (payload) => {
      const { receive, process } = setup();
      await expect(receive(payload)).rejects.toMatchObject({
        code: 'invalid_payload',
      });
      expect(process).not.toHaveBeenCalled();
    },
  );

  it('validates the entire batch before dispatching a valid prefix', async () => {
    const { receive, process } = setup();
    await expect(
      receive({ events: [flat, { ...nested, subscriber: {} }] }),
    ).rejects.toMatchObject({ code: 'invalid_payload' });
    expect(process).not.toHaveBeenCalled();
  });

  it('bounds raw payload and batch size', async () => {
    const small = setup({ maxBodyBytes: 1 });
    await expect(small.receive(flat)).rejects.toMatchObject({
      code: 'payload_too_large',
    });
    expect(small.process).not.toHaveBeenCalled();
    const batch = setup({ maxEvents: 1 });
    await expect(
      batch.receive({ events: [flat, nested] }),
    ).rejects.toMatchObject({ code: 'invalid_payload' });
    expect(batch.process).not.toHaveBeenCalled();
  });

  it.each([
    { webhookSecret: '' },
    { webhookSecret: ' ' },
    { accountId: '' },
    { accountId: 'name' },
    { maxBodyBytes: 0 },
    { maxEvents: 0 },
  ])('fails closed for missing or invalid configuration %j', (overrides) => {
    expect(() => setup(overrides)).toThrow(MailerLiteConfigurationError);
  });

  it('integrates verified withdrawals with application dedupe and retry after partial storage failure', async () => {
    const stored: NewsletterConsentWithdrawnEvent[] = [];
    let fail = true;
    const service = new NewsletterWithdrawalService({
      appendGrant: async () => undefined,
      appendWithdrawalOnce: async (event) => {
        if (
          stored.some(
            (previous) =>
              previous.eventSource === event.eventSource &&
              previous.dedupeKey === event.dedupeKey,
          )
        )
          return 'duplicate';
        if (stored.length === 1 && fail)
          throw new Error('private database details');
        stored.push(event);
        return 'recorded';
      },
    });
    const adapter = new MailerLiteWebhookAdapter(options, service);
    const bytes = body({ events: [flat, nested] });
    await expect(adapter.receive(bytes, sign(bytes))).rejects.toBeInstanceOf(
      NewsletterUnavailableError,
    );
    expect(stored).toHaveLength(1);
    fail = false;
    await expect(adapter.receive(bytes, sign(bytes))).resolves.toEqual({
      recorded: 1,
      duplicates: 1,
    });
    expect(stored).toHaveLength(2);
    expect(
      stored.every(
        (event) => event.kind === 'withdrawn' && !('consentText' in event),
      ),
    ).toBe(true);
  });
});
