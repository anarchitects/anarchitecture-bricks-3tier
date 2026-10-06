import type {
  MailerMessage,
  MailerPort,
} from '@anarchitects/common-nest-mailer';
import { NewsletterConfigurationError } from '../application';
import type { NewsletterNativeMailOptions } from '../config';
import { CryptoNativeToken } from './crypto-native-token';
import { NewsletterNativeMailService } from './native-mail.service';

const options: NewsletterNativeMailOptions = {
  publicationName: 'News <&"\'>',
  confirmationUrl: 'https://example.test/newsletter/confirm',
  unsubscribeUrl: 'https://example.test/newsletter/unsubscribe',
};
const crypto = new CryptoNativeToken();
const preparation = {
  email: 'reader@example.test',
  confirmationToken: crypto.issue('confirm').secret,
  unsubscribeToken: crypto.issue('unsubscribe').secret,
};
function fixture(overrides: Partial<NewsletterNativeMailOptions> = {}) {
  const sendMessage = jest
    .fn<Promise<void>, [MailerMessage]>()
    .mockResolvedValue(undefined);
  const mailer: MailerPort = {
    sendMessage,
    send: jest.fn(),
    sendTemplate: jest.fn(),
  };
  const onDeliveryOutcome = jest.fn();
  const service = new NewsletterNativeMailService(mailer, {
    ...options,
    onDeliveryOutcome,
    ...overrides,
  });
  return { service, sendMessage, onDeliveryOutcome };
}

describe('Newsletter mail through Common MailerPort', () => {
  it('renders escaped defaults and multipart links with only purpose-bound tokens', async () => {
    const { service, sendMessage } = fixture();
    await service.sendConfirmation(preparation);
    const message = sendMessage.mock.calls[0][0];
    expect(message.to).toBe(preparation.email);
    expect(message.html).toContain('News &lt;&amp;&quot;&#39;&gt;');
    expect(message.text).toContain(options.publicationName);
    const urls = message.text?.match(/https:\/\/\S+/g) ?? [];
    expect(urls).toHaveLength(2);
    for (const [index, address] of urls.entries()) {
      const url = new URL(address);
      expect(url.origin).toBe('https://example.test');
      expect([...url.searchParams.keys()]).toEqual(['token']);
      expect(url.searchParams.get('token')).toBe(
        index === 0
          ? preparation.confirmationToken
          : preparation.unsubscribeToken,
      );
      expect(url.pathname).toBe(
        index === 0 ? '/newsletter/confirm' : '/newsletter/unsubscribe',
      );
      expect(address).not.toContain(preparation.email);
      expect(message.html).toContain(address);
    }
  });

  it('snapshots host metadata, subjects and rendering without letting metadata override the recipient', async () => {
    const renderConfirmation = jest
      .fn()
      .mockReturnValue({ html: '<p>Custom</p>', text: 'Custom' });
    const message = {
      from: 'Sender <sender@example.test>',
      replyTo: 'help@example.test',
      headers: { 'X-Host': 'original' },
      to: 'attacker@example.test',
    };
    const { service, sendMessage } = fixture({
      message,
      confirmationSubject: 'Please confirm',
      renderConfirmation,
    });
    message.headers['X-Host'] = 'mutated';
    message.from = 'changed@example.test';
    await service.sendConfirmation(preparation);
    expect(sendMessage).toHaveBeenCalledWith({
      to: preparation.email,
      subject: 'Please confirm',
      html: '<p>Custom</p>',
      text: 'Custom',
      from: 'Sender <sender@example.test>',
      replyTo: 'help@example.test',
      headers: { 'X-Host': 'original' },
    });
    const context = renderConfirmation.mock.calls[0][0];
    expect(Object.keys(context).sort()).toEqual([
      'confirmationUrl',
      'publicationName',
      'unsubscribeUrl',
    ]);
    expect(Object.isFrozen(context)).toBe(true);
  });

  it('bounds retries, reuses exactly the same message, and emits only aggregate outcomes', async () => {
    const { service, sendMessage, onDeliveryOutcome } = fixture({
      maxAttempts: 3,
      retryDelayMs: 0,
    });
    sendMessage.mockRejectedValue(
      new Error(`SMTP ${preparation.email} ${preparation.confirmationToken}`),
    );
    await expect(
      service.sendConfirmation(preparation),
    ).resolves.toBeUndefined();
    expect(sendMessage).toHaveBeenCalledTimes(3);
    expect(sendMessage.mock.calls[0][0]).toBe(sendMessage.mock.calls[2][0]);
    expect(onDeliveryOutcome.mock.calls).toEqual([
      [{ kind: 'confirmation', outcome: 'failed', attempts: 3 }],
    ]);
  });

  it('waits between retries and stops after success', async () => {
    jest.useFakeTimers();
    try {
      const { service, sendMessage, onDeliveryOutcome } = fixture({
        maxAttempts: 3,
        retryDelayMs: 250,
      });
      sendMessage.mockRejectedValueOnce(new Error('offline'));
      const delivery = service.sendConfirmation(preparation);
      expect(sendMessage).toHaveBeenCalledTimes(1);
      await jest.advanceTimersByTimeAsync(249);
      expect(sendMessage).toHaveBeenCalledTimes(1);
      await jest.advanceTimersByTimeAsync(1);
      await delivery;
      expect(sendMessage).toHaveBeenCalledTimes(2);
      expect(onDeliveryOutcome).toHaveBeenCalledWith({
        kind: 'confirmation',
        outcome: 'sent',
        attempts: 2,
      });
    } finally {
      jest.useRealTimers();
    }
  });

  it.each([
    () => {
      throw new Error('sensitive renderer failure');
    },
    () => ({ html: '<p>Missing text</p>', text: '' }),
  ])(
    'keeps render failures neutral without attempting transport',
    async (renderConfirmation) => {
      const { service, sendMessage, onDeliveryOutcome } = fixture({
        renderConfirmation,
      });
      await expect(
        service.sendConfirmation(preparation),
      ).resolves.toBeUndefined();
      expect(sendMessage).not.toHaveBeenCalled();
      expect(onDeliveryOutcome).toHaveBeenCalledWith({
        kind: 'confirmation',
        outcome: 'failed',
        attempts: 0,
      });
    },
  );

  it('keeps observability failures neutral', async () => {
    const { service } = fixture({
      onDeliveryOutcome: () => {
        throw new Error('observer');
      },
    });
    await expect(
      service.sendConfirmation(preparation),
    ).resolves.toBeUndefined();
  });

  it('rejects wrong-purpose or unsafe token material before transport', async () => {
    const { service, sendMessage } = fixture();
    await service.sendConfirmation({
      ...preparation,
      confirmationToken: preparation.unsubscribeToken,
    });
    await service.sendConfirmation({
      ...preparation,
      unsubscribeToken: 'reader@example.test&redirect=evil',
    });
    expect(sendMessage).not.toHaveBeenCalled();
  });

  it('renders token-free withdrawal receipts, with customization and explicit disable', async () => {
    const { service, sendMessage } = fixture();
    await service.sendUnsubscribed(preparation.email);
    expect(sendMessage.mock.calls[0][0]).toMatchObject({
      to: preparation.email,
      text: `You have been unsubscribed from ${options.publicationName}.`,
    });
    expect(sendMessage.mock.calls[0][0].html).toContain('&lt;&amp;');
    const custom = fixture({
      unsubscribedSubject: 'Goodbye',
      renderUnsubscribed: () => ({ html: '<p>Goodbye</p>', text: 'Goodbye' }),
    });
    await custom.service.sendUnsubscribed(preparation.email);
    expect(custom.sendMessage).toHaveBeenCalledWith(
      expect.objectContaining({ subject: 'Goodbye', text: 'Goodbye' }),
    );
    const disabled = fixture({ notifyUnsubscribe: false });
    await disabled.service.sendUnsubscribed(preparation.email);
    expect(disabled.sendMessage).not.toHaveBeenCalled();
  });

  it.each([
    { confirmationUrl: 'http://example.test/confirm' },
    { unsubscribeUrl: 'https://user:password@example.test/unsubscribe' },
    {
      confirmationUrl: 'https://example.test/confirm?email=reader@example.test',
    },
    { confirmationUrl: 'https://example.test/confirm#fragment' },
    { confirmationUrl: 'https://example.test/confirm?' },
    { confirmationUrl: '/confirm' },
    { publicationName: '' },
    { confirmationSubject: 'bad\r\nheader' },
    { maxAttempts: 0 },
    { maxAttempts: 4 },
    { maxAttempts: 1.1 },
    { retryDelayMs: -1 },
    { retryDelayMs: 5001 },
    { retryDelayMs: NaN },
  ])('rejects unsafe host configuration %p', (overrides) => {
    expect(() => fixture(overrides)).toThrow(NewsletterConfigurationError);
  });

  it('fails startup when an old/custom Common Mailer lacks the required capability', () => {
    expect(
      () =>
        new NewsletterNativeMailService(
          { send: jest.fn(), sendTemplate: jest.fn() } as unknown as MailerPort,
          options,
        ),
    ).toThrow(NewsletterConfigurationError);
  });
});
