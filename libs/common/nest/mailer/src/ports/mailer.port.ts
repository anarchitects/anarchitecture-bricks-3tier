/** Transport-neutral rendered message. At least one body alternative is required. */
export type MailerMessage = {
  readonly to: string;
  readonly subject: string;
  readonly from?: string;
  readonly replyTo?: string;
  readonly headers?: Readonly<Record<string, string>>;
} & (
  | { readonly html: string; readonly text?: string }
  | { readonly text: string; readonly html?: string }
);

export abstract class MailerPort {
  abstract sendMessage(message: MailerMessage): Promise<void>;
  abstract send(to: string, subject: string, html: string): Promise<void>;
  abstract sendTemplate(
    to: string,
    subject: string,
    template: string,
    context?: Record<string, unknown>,
  ): Promise<void>;
}
