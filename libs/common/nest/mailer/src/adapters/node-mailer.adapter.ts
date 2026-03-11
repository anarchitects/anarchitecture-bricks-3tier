import { MailerService } from '@nestjs-modules/mailer';
import { Injectable } from '@nestjs/common';
import { MailerPort } from '../ports/mailer.port';

@Injectable()
export class NodeMailerAdapter implements MailerPort {
  constructor(private readonly mailer: MailerService) {}

  async send(to: string, subject: string, html: string) {
    return await this.mailer.sendMail({ to, subject, html });
  }

  async sendTemplate(
    to: string,
    subject: string,
    template: string,
    context?: Record<string, unknown>,
  ) {
    return await this.mailer.sendMail({ to, subject, template, context });
  }
}
