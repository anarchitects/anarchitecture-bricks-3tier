import type {
  NewsletterSubscriberRequest,
  SubscriberPort,
} from '../application/ports/subscriber.port';
import { NewsletterUnavailableError } from '../application/newsletter.errors';
import { MailerLiteConfigurationError } from './mailerlite.errors';

export interface MailerLiteSubscriberOptions {
  readonly apiKey: string;
  readonly groupId: string;
  /** Optional existing MailerLite custom field receiving request.source. */
  readonly sourceField?: string;
  /** Per-attempt timeout; default 5000ms, maximum 30000ms. */
  readonly timeoutMs?: number;
  /** Includes the initial request; default 2, maximum 3. */
  readonly maxAttempts?: number;
  /** Exponential retry base; default 250ms, maximum 1000ms. */
  readonly retryDelayMs?: number;
  /** Maximum acceptable Retry-After/backoff; default 2000ms, maximum 30000ms. */
  readonly maxRetryDelayMs?: number;
}

export interface MailerLiteSubscriberDependencies {
  readonly fetch?: typeof fetch;
  readonly sleep?: (milliseconds: number) => Promise<void>;
}

const API_URL = 'https://connect.mailerlite.com/api/subscribers';
const unavailable = () =>
  new NewsletterUnavailableError('subscriber_unavailable');

function integer(value: number, min: number, max: number): number {
  if (!Number.isInteger(value) || value < min || value > max) {
    throw new MailerLiteConfigurationError();
  }
  return value;
}

/** Requests unconfirmed subscriptions; never sends active status or resubscribe=true. */
export class MailerLiteSubscriberAdapter implements SubscriberPort {
  private readonly options: Required<
    Omit<MailerLiteSubscriberOptions, 'sourceField'>
  > &
    Pick<MailerLiteSubscriberOptions, 'sourceField'>;
  private readonly fetcher: typeof fetch;
  private readonly sleep: (milliseconds: number) => Promise<void>;

  constructor(
    options: MailerLiteSubscriberOptions,
    dependencies: MailerLiteSubscriberDependencies = {},
  ) {
    if (
      !options ||
      typeof options.apiKey !== 'string' ||
      !options.apiKey.trim() ||
      /[\r\n]/.test(options.apiKey) ||
      typeof options.groupId !== 'string' ||
      !/^\d+(?![\s\S])/.test(options.groupId) ||
      (options.sourceField !== undefined &&
        (typeof options.sourceField !== 'string' ||
          !options.sourceField.trim()))
    ) {
      throw new MailerLiteConfigurationError();
    }
    this.options = {
      apiKey: options.apiKey,
      groupId: options.groupId,
      sourceField: options.sourceField,
      timeoutMs: integer(options.timeoutMs ?? 5000, 1, 30000),
      maxAttempts: integer(options.maxAttempts ?? 2, 1, 3),
      retryDelayMs: integer(options.retryDelayMs ?? 250, 0, 1000),
      maxRetryDelayMs: integer(options.maxRetryDelayMs ?? 2000, 0, 30000),
    };
    this.fetcher = dependencies.fetch ?? globalThis.fetch;
    this.sleep =
      dependencies.sleep ??
      ((ms) => new Promise((resolve) => setTimeout(resolve, ms)));
  }

  async subscribe(request: NewsletterSubscriberRequest): Promise<void> {
    const body = JSON.stringify({
      email: request.email,
      status: 'unconfirmed',
      resubscribe: false,
      groups: [this.options.groupId],
      ...(this.options.sourceField && request.source !== undefined
        ? { fields: { [this.options.sourceField]: request.source } }
        : {}),
    });
    for (let attempt = 0; attempt < this.options.maxAttempts; attempt++) {
      let response: Response | undefined;
      try {
        response = await this.send(body);
      } catch {
        // Network errors and timeouts are retried within the same finite budget.
      }
      let delayMs = this.options.retryDelayMs * 2 ** attempt;
      if (response) {
        // Never read or expose subscriber details or provider validation messages.
        void response.body?.cancel().catch(() => undefined);
        if (
          (response.status >= 200 && response.status < 300) ||
          response.status === 422
        )
          return;
        if (
          response.status !== 408 &&
          response.status !== 429 &&
          response.status < 500
        )
          throw unavailable();
        const retryAfter = response.headers.get('retry-after');
        if (retryAfter !== null) {
          const seconds = /^\d+(?:\.\d+)?$/.test(retryAfter)
            ? Number(retryAfter)
            : undefined;
          const wait =
            seconds !== undefined
              ? seconds * 1000
              : Date.parse(retryAfter) - Date.now();
          if (wait === Infinity) throw unavailable();
          if (Number.isFinite(wait)) delayMs = Math.max(delayMs, wait);
        }
      }
      // Do not retry earlier than Retry-After just to fit the local delay budget.
      if (
        attempt + 1 === this.options.maxAttempts ||
        delayMs > this.options.maxRetryDelayMs
      )
        throw unavailable();
      try {
        await this.sleep(delayMs);
      } catch {
        throw unavailable();
      }
    }
    throw unavailable();
  }

  private async send(body: string): Promise<Response> {
    const controller = new AbortController();
    let timer: ReturnType<typeof setTimeout> | undefined;
    try {
      const timeout = new Promise<never>((_resolve, reject) => {
        timer = setTimeout(() => {
          controller.abort();
          reject(unavailable());
        }, this.options.timeoutMs);
      });
      const pending = this.fetcher(API_URL, {
        method: 'POST',
        redirect: 'error',
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${this.options.apiKey}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body,
      });
      // Also discard a late response from an injected transport that ignores abort.
      void pending.then(
        (response) => {
          if (controller.signal.aborted)
            void response.body?.cancel().catch(() => undefined);
        },
        () => undefined,
      );
      return await Promise.race([pending, timeout]);
    } finally {
      clearTimeout(timer);
    }
  }
}
