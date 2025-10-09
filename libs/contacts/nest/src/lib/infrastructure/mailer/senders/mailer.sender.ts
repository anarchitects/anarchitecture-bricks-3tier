import { Injectable } from '@nestjs/common';
import { ContactsMailSender } from '../../../application/ports/contacts.mail-sender';
import { MailerService } from '@nestjs-modules/mailer';
import {
  ContactsMailerConfig,
  InjectContactsMailerConfig,
} from '../config/config';

@Injectable()
export class NestContactsMailSender implements ContactsMailSender {
  constructor(
    private readonly mailerService: MailerService,
    @InjectContactsMailerConfig() private readonly config: ContactsMailerConfig
  ) {}
  async sendMail(name: string, email: string, message: string): Promise<void> {
    // first send contact info to site admin
    await this.mailerService.sendMail({
      subject: `New contact message:`,
      template: this.config.templateIn,
      context: {
        name,
        email,
        message,
      },
    });
    // then send confirmation to user
    await this.mailerService.sendMail({
      to: email,
      template: this.config.templateOut,
      context: {
        name,
        email,
      },
      subject: 'We received your message',
    });
  }
}
