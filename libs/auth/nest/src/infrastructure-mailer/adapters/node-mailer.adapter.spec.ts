import { Test, TestingModule } from '@nestjs/testing';
import { NodeMailerAdapter } from './node-mailer.adapter';
import { MailerService } from '@nestjs-modules/mailer';

describe('NodeMailerAdapter', () => {
  let adapter: NodeMailerAdapter;
  const mockMailerService = {
    sendMail: jest.fn().mockResolvedValue({}),
  };

  beforeEach(async () => {
    mockMailerService.sendMail.mockClear();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NodeMailerAdapter,
        { provide: MailerService, useValue: mockMailerService },
      ],
    }).compile();

    adapter = module.get<NodeMailerAdapter>(NodeMailerAdapter);
  });

  describe('send', () => {
    it('should send an email', async () => {
      const to = 'test@example.com';
      const subject = 'Test Subject';
      const html = '<p>Test HTML</p>';
      await adapter.send(to, subject, html);
      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to,
        subject,
        html,
      });
    });
  });

  describe('sendTemplate', () => {
    it('should send a templated email', async () => {
      const to = 'test@example.com';
      const subject = 'Test Subject';
      const template = 'test-template';
      const context = { name: 'Test' };
      await adapter.sendTemplate(to, subject, template, context);
      expect(mockMailerService.sendMail).toHaveBeenCalledWith({
        to,
        subject,
        template,
        context,
      });
    });
  });
});
