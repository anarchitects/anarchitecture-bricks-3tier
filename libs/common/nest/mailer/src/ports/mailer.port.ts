export abstract class MailerPort {
  abstract send(to: string, subject: string, html: string): Promise<void>;
  abstract sendTemplate(
    to: string,
    subject: string,
    template: string,
    context?: Record<string, unknown>,
  ): Promise<void>;
}
