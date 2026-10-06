import type { NewsletterNativeSubscriber } from '@anarchitects/newsletter-ts/models';
import { NewsletterSubscriptionRequestSchema } from '@anarchitects/newsletter-ts/dtos';
import { Value } from '@sinclair/typebox/value';
import type { NewsletterNativeOptions } from '../config/native-options';
import { recordingTime, type NewsletterClock } from './newsletter-clock';
import {
  NewsletterConfigurationError,
  NewsletterUnavailableError,
  NewsletterValidationError,
} from './newsletter.errors';
import type {
  NativeSubscriberRepositoryPort,
  NewsletterNativeTokenPurpose,
} from './ports/native-subscriber-repository.port';
import type { NativeTokenPort } from './ports/native-token.port';
import type { NewsletterSubscriberRequest } from './ports/subscriber.port';

/** Trusted backend handoff for #447, never a public DTO or log payload. Raw tokens exist only here. */
export interface NewsletterNativePreparation {
  readonly email: string;
  readonly confirmationToken: string;
  readonly unsubscribeToken: string;
}

export class NewsletterNativeLifecycleService {
  private readonly options: Required<NewsletterNativeOptions>;
  constructor(
    private readonly repository: NativeSubscriberRepositoryPort,
    private readonly tokens: NativeTokenPort,
    options: NewsletterNativeOptions,
    private readonly clock: NewsletterClock = () => new Date(),
  ) {
    const resolved = {
      scope: options?.scope,
      confirmationTtlMs: options?.confirmationTtlMs ?? 86_400_000,
      unsubscribeTtlMs: options?.unsubscribeTtlMs ?? 2_592_000_000,
      resendCooldownMs: options?.resendCooldownMs ?? 60_000,
    };
    if (
      typeof resolved.scope !== 'string' ||
      !resolved.scope.trim() ||
      resolved.scope.length > 128 ||
      [
        resolved.confirmationTtlMs,
        resolved.unsubscribeTtlMs,
        resolved.resendCooldownMs,
      ].some(
        (value) =>
          !Number.isSafeInteger(value) || value <= 0 || value > 31_536_000_000,
      ) ||
      resolved.resendCooldownMs > resolved.confirmationTtlMs ||
      resolved.resendCooldownMs > resolved.unsubscribeTtlMs
    ) {
      throw new NewsletterConfigurationError();
    }
    this.options = Object.freeze(resolved);
  }

  /** Internal subscriber seam: invoke only after NewsletterSubscriptionService has committed fresh consent. */
  async prepareSubscription(
    request: NewsletterSubscriberRequest,
  ): Promise<NewsletterNativePreparation | undefined> {
    if (
      !request ||
      !Value.Check(
        NewsletterSubscriptionRequestSchema.properties.email,
        request.email,
      )
    )
      throw new NewsletterValidationError('invalid_request');
    const email = request.email.toLowerCase();
    return this.storage(() =>
      this.repository.transact(this.options.scope, { email }, async (tx) => {
        const now = recordingTime(this.clock);
        const current = tx.subscriber;
        if (current?.status === 'active') return undefined;
        if (
          current?.status === 'pending_confirmation' &&
          now.getTime() - current.lastTokenIssuedAt.getTime() <
            this.options.resendCooldownMs
        )
          return undefined;
        const subscriber: NewsletterNativeSubscriber = {
          id: current?.id ?? this.tokens.newId(),
          scope: this.options.scope,
          email,
          status: 'pending_confirmation',
          generation:
            current?.status === 'pending_confirmation'
              ? current.generation
              : this.tokens.newId(),
          createdAt: current?.createdAt ?? now,
          updatedAt: now,
          lastTokenIssuedAt: now,
        };
        const confirmation = this.tokens.issue('confirm');
        const unsubscribe = this.tokens.issue('unsubscribe');
        await tx.saveSubscriber(subscriber);
        await tx.deleteTokens(subscriber.id);
        for (const [purpose, token, ttl] of [
          ['confirm', confirmation, this.options.confirmationTtlMs],
          ['unsubscribe', unsubscribe, this.options.unsubscribeTtlMs],
        ] as const) {
          await tx.saveToken({
            hash: token.hash,
            subscriberId: subscriber.id,
            generation: subscriber.generation,
            purpose,
            expiresAt: new Date(now.getTime() + ttl),
            consumedAt: null,
          });
        }
        return {
          email,
          confirmationToken: confirmation.secret,
          unsubscribeToken: unsubscribe.secret,
        };
      }),
    );
  }

  /** Neutral result for missing, invalid, expired, consumed and already-completed tokens. */
  async confirm(secret: unknown): Promise<void> {
    await this.consume(secret, 'confirm');
  }
  async unsubscribe(secret: unknown): Promise<void> {
    await this.consume(secret, 'unsubscribe');
  }

  private async consume(
    secret: unknown,
    purpose: NewsletterNativeTokenPurpose,
  ): Promise<void> {
    const hash = this.tokens.hash(secret, purpose);
    if (!hash) return;
    await this.storage(() =>
      this.repository.transact(
        this.options.scope,
        { tokenHash: hash },
        async (tx) => {
          const now = recordingTime(this.clock);
          const subscriber = tx.subscriber;
          const token = tx.token;
          if (
            !subscriber ||
            !token ||
            token.purpose !== purpose ||
            token.subscriberId !== subscriber.id ||
            token.generation !== subscriber.generation ||
            token.consumedAt ||
            token.expiresAt.getTime() <= now.getTime()
          )
            return;
          if (purpose === 'confirm') {
            if (subscriber.status !== 'pending_confirmation') return;
            await tx.saveSubscriber({
              ...subscriber,
              status: 'active',
              updatedAt: now,
            });
          } else {
            if (subscriber.status === 'unsubscribed') return;
            await tx.saveSubscriber({
              ...subscriber,
              status: 'unsubscribed',
              updatedAt: now,
            });
            await tx.appendWithdrawal({
              kind: 'withdrawn',
              email: subscriber.email,
              recordedAt: now,
              eventSource: `native:${this.options.scope}`,
              dedupeKey: `${subscriber.id}:${subscriber.generation}`,
            });
            await tx.deleteTokens(subscriber.id, 'confirm');
          }
          await tx.saveToken({ ...token, consumedAt: now });
        },
      ),
    );
  }

  private async storage<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await operation();
    } catch {
      throw new NewsletterUnavailableError('subscriber_unavailable');
    }
  }
}
