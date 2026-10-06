import { NewsletterNativeLifecycleService } from './native-lifecycle.service';
import type { NativeSubscriberRepositoryPort } from './ports/native-subscriber-repository.port';
import type { NativeTokenPort } from './ports/native-token.port';
import {
  NewsletterConfigurationError,
  NewsletterUnavailableError,
  NewsletterValidationError,
} from './newsletter.errors';

const repository: NativeSubscriberRepositoryPort = { transact: jest.fn() };
const tokens: NativeTokenPort = {
  newId: jest.fn(),
  issue: jest.fn(),
  hash: jest.fn(),
};
describe('native application boundary', () => {
  afterEach(() => jest.resetAllMocks());
  it.each([
    { scope: '' },
    { scope: 'x'.repeat(129) },
    { scope: 'a', confirmationTtlMs: 0 },
    { scope: 'a', resendCooldownMs: NaN },
    { scope: 'a', unsubscribeTtlMs: Infinity },
    { scope: 'a', confirmationTtlMs: 1000, resendCooldownMs: 1001 },
  ])('rejects unsafe configuration %p', (options) => {
    expect(
      () => new NewsletterNativeLifecycleService(repository, tokens, options),
    ).toThrow(NewsletterConfigurationError);
  });
  it('rejects invalid email before persistence and hides operational details', async () => {
    const service = new NewsletterNativeLifecycleService(repository, tokens, {
      scope: 'a',
    });
    await expect(
      service.prepareSubscription({ email: 'bad' }),
    ).rejects.toBeInstanceOf(NewsletterValidationError);
    expect(repository.transact).not.toHaveBeenCalled();
    jest
      .mocked(repository.transact)
      .mockRejectedValue(new Error('raw connection/token details'));
    await expect(
      service.prepareSubscription({ email: 'reader@example.test' }),
    ).rejects.toEqual(new NewsletterUnavailableError('subscriber_unavailable'));
  });
  it('rejects malformed tokens without storage access', async () => {
    const service = new NewsletterNativeLifecycleService(repository, tokens, {
      scope: 'a',
    });
    jest.mocked(tokens.hash).mockReturnValue(undefined);
    await service.confirm('invalid');
    await service.unsubscribe('invalid');
    expect(repository.transact).not.toHaveBeenCalled();
  });
});
