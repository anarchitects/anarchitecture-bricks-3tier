import { Injectable } from '@nestjs/common';
import { MailerService } from '@nestjs-modules/mailer';
import { MailerPort } from '../../application';

@Injectable()
export class NestMailerAdapter implements MailerPort {
  constructor(private readonly mailer: MailerService) {}
  async send(to: string, subject: string, html: string) {
    return await this.mailer.sendMail({ to, subject, html });
  }
  async sendTemplate(
    to: string,
    subject: string,
    template: string,
    context?: Record<string, unknown>
  ) {
    return await this.mailer.sendMail({ to, subject, template, context });
  }
}
