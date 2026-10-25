import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { MailerPort, type MailerMessage } from '../ports/mailer.port';

@Injectable()
export class NodeMailerAdapter implements MailerPort {
  constructor(private readonly mailer: MailerService) {}

  async sendMessage(message: MailerMessage): Promise<void> {
    const { to, subject, html, text, from, replyTo, headers } = message;
    await this.mailer.sendMail({
      to,
      subject,
      ...(html === undefined ? {} : { html }),
      ...(text === undefined ? {} : { text }),
      ...(from === undefined ? {} : { from }),
      ...(replyTo === undefined ? {} : { replyTo }),
      ...(headers === undefined ? {} : { headers: { ...headers } }),
    });
  }

  // Preserve the legacy adapter's Promise<any> declaration and provider result.
  // Nodemailer 10 ships stricter types; changing this to void would discard an
  // existing runtime result, while exposing its new type would break MailerPort.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  async send(to: string, subject: string, html: string): Promise<any> {
    return await this.mailer.sendMail({ to, subject, html });
  }

  async sendTemplate(
    to: string,
    subject: string,
    template: string,
    context?: Record<string, unknown>,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  ): Promise<any> {
    return await this.mailer.sendMail({ to, subject, template, context });
  }
}
