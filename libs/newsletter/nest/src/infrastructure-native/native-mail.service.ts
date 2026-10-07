import type {
  MailerMessage,
  MailerPort,
} from '@anarchitects/common-nest-mailer';
import {
  NewsletterConfigurationError,
  type NewsletterNativeMailPort,
  type NewsletterNativePreparation,
} from '../application';
import type {
  NewsletterNativeMailOptions,
  NewsletterMailDeliveryOutcome,
  NewsletterRenderedMail,
} from '../config';

function escapeHtml(value: string): string {
  return value.replace(
    /[&<>"']/g,
    (character) =>
      ({
        '&': '&amp;',
        '<': '&lt;',
        '>': '&gt;',
        '"': '&quot;',
        "'": '&#39;',
      })[character] ?? character,
  );
}

/** Newsletter rendering and bounded delivery through the host's existing Common Mailer. */
export class NewsletterNativeMailService implements NewsletterNativeMailPort {
  private readonly options: NewsletterNativeMailOptions;
  private readonly maxAttempts: number;
  private readonly retryDelayMs: number;

  constructor(
    private readonly mailer: MailerPort,
    options: NewsletterNativeMailOptions,
  ) {
    this.maxAttempts = options?.maxAttempts ?? 1;
    this.retryDelayMs = options?.retryDelayMs ?? 250;
    if (
      typeof mailer?.sendMessage !== 'function' ||
      !options ||
      !this.endpoint(options.confirmationUrl) ||
      !this.endpoint(options.unsubscribeUrl) ||
      !this.label(options.publicationName) ||
      (options.confirmationSubject !== undefined &&
        !this.label(options.confirmationSubject)) ||
      (options.unsubscribedSubject !== undefined &&
        !this.label(options.unsubscribedSubject)) ||
      !Number.isInteger(this.maxAttempts) ||
      this.maxAttempts < 1 ||
      this.maxAttempts > 3 ||
      !Number.isInteger(this.retryDelayMs) ||
      this.retryDelayMs < 0 ||
      this.retryDelayMs > 5000 ||
      (options.notifyUnsubscribe !== undefined &&
        typeof options.notifyUnsubscribe !== 'boolean') ||
      [
        options.renderConfirmation,
        options.renderUnsubscribed,
        options.onDeliveryOutcome,
      ].some((value) => value !== undefined && typeof value !== 'function')
    )
      throw new NewsletterConfigurationError();
    this.options = Object.freeze({
      ...options,
      message: Object.freeze({
        ...options.message,
        ...(options.message?.headers
          ? { headers: Object.freeze({ ...options.message.headers }) }
          : {}),
      }),
    });
  }

  async sendConfirmation(
    preparation: NewsletterNativePreparation,
  ): Promise<void> {
    await this.deliver('confirmation', () => {
      const context = Object.freeze({
        publicationName: this.options.publicationName,
        confirmationUrl: this.link(
          this.options.confirmationUrl,
          preparation.confirmationToken,
          'c',
        ),
        unsubscribeUrl: this.link(
          this.options.unsubscribeUrl,
          preparation.unsubscribeToken,
          'u',
        ),
      });
      const name = escapeHtml(context.publicationName);
      const rendered = this.options.renderConfirmation?.(context) ?? {
        html: `<p>Confirm your subscription to ${name}.</p><p><a href="${escapeHtml(context.confirmationUrl)}">Confirm subscription</a></p><p>If you did not request this, ignore this email or <a href="${escapeHtml(context.unsubscribeUrl)}">unsubscribe</a>.</p>`,
        text: `Confirm your subscription to ${context.publicationName}:\n${context.confirmationUrl}\n\nIf you did not request this, ignore this email or unsubscribe:\n${context.unsubscribeUrl}`,
      };
      return this.message(
        preparation.email,
        this.options.confirmationSubject ??
          `Confirm your subscription to ${context.publicationName}`,
        rendered,
      );
    });
  }

  async sendUnsubscribed(email: string): Promise<void> {
    if (this.options.notifyUnsubscribe === false) return;
    await this.deliver('unsubscribed', () => {
      const context = Object.freeze({
        publicationName: this.options.publicationName,
      });
      const rendered = this.options.renderUnsubscribed?.(context) ?? {
        html: `<p>You have been unsubscribed from ${escapeHtml(context.publicationName)}.</p>`,
        text: `You have been unsubscribed from ${context.publicationName}.`,
      };
      return this.message(
        email,
        this.options.unsubscribedSubject ??
          `Unsubscribed from ${context.publicationName}`,
        rendered,
      );
    });
  }

  private message(
    to: string,
    subject: string,
    rendered: NewsletterRenderedMail,
  ): MailerMessage {
    if (
      !rendered ||
      typeof rendered.html !== 'string' ||
      !rendered.html.trim() ||
      typeof rendered.text !== 'string' ||
      !rendered.text.trim()
    )
      throw new NewsletterConfigurationError();
    // Whitelist metadata so even untyped host objects cannot override recipient, subject or bodies.
    const metadata = this.options.message;
    return Object.freeze({
      ...(metadata?.from === undefined ? {} : { from: metadata.from }),
      ...(metadata?.replyTo === undefined ? {} : { replyTo: metadata.replyTo }),
      ...(metadata?.headers === undefined ? {} : { headers: metadata.headers }),
      to,
      subject,
      html: rendered.html,
      text: rendered.text,
    });
  }

  private async deliver(
    kind: NewsletterMailDeliveryOutcome['kind'],
    render: () => MailerMessage,
  ): Promise<void> {
    let attempts = 0;
    let outcome: NewsletterMailDeliveryOutcome['outcome'] = 'failed';
    try {
      // Render once: retries use identical links, never mint another token or mutate state.
      const message = render();
      while (attempts < this.maxAttempts) {
        attempts++;
        try {
          await this.mailer.sendMessage(message);
          outcome = 'sent';
          break;
        } catch {
          if (attempts < this.maxAttempts && this.retryDelayMs > 0)
            await new Promise<void>((resolve) =>
              setTimeout(resolve, this.retryDelayMs),
            );
        }
      }
    } catch {
      /* Rendering failure is neutral too; never expose sensitive context. */
    }
    try {
      await this.options.onDeliveryOutcome?.(
        Object.freeze({ kind, outcome, attempts }),
      );
    } catch {
      /* Observability must not alter the public response or committed state. */
    }
  }

  private endpoint(value: unknown): boolean {
    if (
      typeof value !== 'string' ||
      value.trim() !== value ||
      !value.startsWith('https://') ||
      /[\s?#\\]/.test(value)
    )
      return false;
    try {
      const url = new URL(value);
      return (
        url.protocol === 'https:' &&
        !!url.hostname &&
        !url.username &&
        !url.password
      );
    } catch {
      return false;
    }
  }
  private label(value: unknown): boolean {
    return (
      typeof value === 'string' &&
      !!value.trim() &&
      !/[\r\n\0]/.test(value) &&
      value.length <= 200
    );
  }
  private link(endpoint: string, token: string, purpose: 'c' | 'u'): string {
    if (!new RegExp(`^v1\\.${purpose}\\.[A-Za-z0-9_-]{43}$`).test(token))
      throw new NewsletterConfigurationError();
    const url = new URL(endpoint);
    url.searchParams.set('token', token);
    return url.toString();
  }
}
