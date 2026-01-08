export abstract class MailerAdapter {
  abstract send(to: string, subject: string, html: string): Promise<void>;
  abstract sendTemplate(
    to: string,
    subject: string,
    template: string,
    context?: Record<string, unknown>
  ): Promise<void>;
}
