import {
  NewsletterNativeLifecycleService,
  NewsletterUnavailableError,
  NewsletterConfigurationError,
  type NewsletterNativeMailPort,
} from '../application';
import { NativeSubscriberAdapter } from './native-subscriber.adapter';
import { NativeUnsubscribeService } from './native-unsubscribe.service';

function fixture() {
  const lifecycle = {
    prepareSubscription: jest.fn(),
    unsubscribeAndPrepareNotification: jest.fn(),
  };
  const mail: jest.Mocked<NewsletterNativeMailPort> = {
    sendConfirmation: jest.fn(),
    sendUnsubscribed: jest.fn(),
  };
  const core = lifecycle as unknown as NewsletterNativeLifecycleService;
  return {
    lifecycle,
    mail,
    subscriber: new NativeSubscriberAdapter(core, mail),
    withdrawal: new NativeUnsubscribeService(core, mail),
  };
}

describe('native mail orchestration boundaries', () => {
  it('requires explicit mail wiring instead of silently accepting a missing provider', () => {
    const core = {} as NewsletterNativeLifecycleService;
    const missing = undefined as unknown as NewsletterNativeMailPort;
    expect(() => new NativeSubscriberAdapter(core, missing)).toThrow(
      NewsletterConfigurationError,
    );
    expect(() => new NativeUnsubscribeService(core, missing)).toThrow(
      NewsletterConfigurationError,
    );
  });

  it('awaits preparation commit before sending and returns no private handoff', async () => {
    const { lifecycle, mail, subscriber } = fixture();
    let commit!: (value: unknown) => void;
    lifecycle.prepareSubscription.mockReturnValue(
      new Promise((resolve) => {
        commit = resolve;
      }),
    );
    const pending = subscriber.subscribe({ email: 'reader@example.test' });
    expect(mail.sendConfirmation).not.toHaveBeenCalled();
    const preparation = {
      email: 'reader@example.test',
      confirmationToken: 'private',
      unsubscribeToken: 'private',
    };
    commit(preparation);
    expect(await pending).toBeUndefined();
    expect(mail.sendConfirmation).toHaveBeenCalledWith(preparation);
  });

  it('treats active/cooldown suppression and custom mail failure neutrally', async () => {
    const { lifecycle, mail, subscriber } = fixture();
    await expect(
      subscriber.subscribe({ email: 'reader@example.test' }),
    ).resolves.toBeUndefined();
    expect(mail.sendConfirmation).not.toHaveBeenCalled();
    lifecycle.prepareSubscription.mockResolvedValue({
      email: 'reader@example.test',
    });
    mail.sendConfirmation.mockRejectedValue(
      new Error('private delivery failure'),
    );
    await expect(
      subscriber.subscribe({ email: 'reader@example.test' }),
    ).resolves.toBeUndefined();
  });

  it('sends no mail when subscription persistence fails', async () => {
    const { lifecycle, mail, subscriber } = fixture();
    lifecycle.prepareSubscription.mockRejectedValue(
      new NewsletterUnavailableError('subscriber_unavailable'),
    );
    await expect(
      subscriber.subscribe({ email: 'reader@example.test' }),
    ).rejects.toBeInstanceOf(NewsletterUnavailableError);
    expect(mail.sendConfirmation).not.toHaveBeenCalled();
  });

  it('awaits withdrawal commit, keeps receipt failure neutral and suppresses invalid/replayed receipts', async () => {
    const { lifecycle, mail, withdrawal } = fixture();
    let commit!: (value: unknown) => void;
    lifecycle.unsubscribeAndPrepareNotification.mockReturnValueOnce(
      new Promise((resolve) => {
        commit = resolve;
      }),
    );
    mail.sendUnsubscribed.mockRejectedValue(
      new Error('private receipt failure'),
    );
    const pending = withdrawal.unsubscribe('secret');
    expect(mail.sendUnsubscribed).not.toHaveBeenCalled();
    commit({ email: 'reader@example.test' });
    await expect(pending).resolves.toBeUndefined();
    expect(mail.sendUnsubscribed).toHaveBeenCalledWith('reader@example.test');
    await withdrawal.unsubscribe('secret');
    expect(mail.sendUnsubscribed).toHaveBeenCalledTimes(1);
  });

  it('never sends a receipt when atomic withdrawal fails', async () => {
    const { lifecycle, mail, withdrawal } = fixture();
    lifecycle.unsubscribeAndPrepareNotification.mockRejectedValue(
      new NewsletterUnavailableError('subscriber_unavailable'),
    );
    await expect(withdrawal.unsubscribe('secret')).rejects.toBeInstanceOf(
      NewsletterUnavailableError,
    );
    expect(mail.sendUnsubscribed).not.toHaveBeenCalled();
  });
});
