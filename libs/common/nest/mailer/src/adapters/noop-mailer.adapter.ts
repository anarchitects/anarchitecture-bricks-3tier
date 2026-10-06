import { Injectable } from '@nestjs/common';
import { MailerPort, type MailerMessage } from '../ports/mailer.port';

@Injectable()
export class NoopMailerAdapter implements MailerPort {
  async sendMessage(_message: MailerMessage): Promise<void> {
    return;
  }

  async send(_to: string, _subject: string, _html: string): Promise<void> {
    return;
  }

  async sendTemplate(
    _to: string,
    _subject: string,
    _template: string,
    _context?: Record<string, unknown>,
  ): Promise<void> {
    return;
  }
}
