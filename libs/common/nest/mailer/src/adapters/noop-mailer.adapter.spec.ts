import { Test } from '@nestjs/testing';
import { CommonMailerModule } from '../common-mailer.module';
import { MailerPort } from '../ports/mailer.port';
import { NoopMailerAdapter } from './noop-mailer.adapter';

describe('noop structured messages', () => {
  it('uses existing provider wiring without any transport dependency', async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [CommonMailerModule.forRoot({ provider: 'noop' })],
    }).compile();
    try {
      const mailer = moduleRef.get(MailerPort);
      expect(mailer).toBeInstanceOf(NoopMailerAdapter);
      await expect(
        mailer.sendMessage({
          to: 'reader@example.test',
          subject: 'Subject',
          html: '<p>Hello</p>',
          text: 'Hello',
          from: 'sender@example.test',
          replyTo: 'help@example.test',
          headers: { 'X-Example': 'value' },
        }),
      ).resolves.toBeUndefined();
    } finally {
      await moduleRef.close();
    }
  });
});
