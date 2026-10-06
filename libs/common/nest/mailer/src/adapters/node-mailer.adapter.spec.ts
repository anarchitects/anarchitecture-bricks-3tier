import { MailerService } from '@nestjs-modules/mailer';
import { Test, TestingModule } from '@nestjs/testing';
import { NodeMailerAdapter } from './node-mailer.adapter';

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

  it('sends HTML emails', async () => {
    await adapter.send('test@example.com', 'Test Subject', '<p>Test HTML</p>');

    expect(mockMailerService.sendMail).toHaveBeenCalledWith({
      to: 'test@example.com',
      subject: 'Test Subject',
      html: '<p>Test HTML</p>',
    });
  });

  it('sends templated emails', async () => {
    await adapter.sendTemplate(
      'test@example.com',
      'Test Subject',
      'test-template',
      { name: 'Test' },
    );

    expect(mockMailerService.sendMail).toHaveBeenCalledWith({
      to: 'test@example.com',
      subject: 'Test Subject',
      template: 'test-template',
      context: { name: 'Test' },
    });
  });
});

describe('structured mail contract', () => {
  it('forwards multipart bodies and metadata, without exposing the provider response', async () => {
    const sendMail = jest.fn().mockResolvedValue({ messageId: 'private' });
    const adapter = new NodeMailerAdapter({
      sendMail,
    } as unknown as MailerService);
    const message = Object.freeze({
      to: 'reader@example.test',
      subject: 'Subject',
      html: '<p>Hello</p>',
      text: 'Hello',
      from: 'Sender <sender@example.test>',
      replyTo: 'help@example.test',
      headers: Object.freeze({ 'X-Example': 'value' }),
    });
    expect(await adapter.sendMessage(message)).toBeUndefined();
    expect(sendMail).toHaveBeenCalledWith(message);
    expect(sendMail.mock.calls[0][0].headers).not.toBe(message.headers);
  });

  it('supports text-only messages and propagates transport rejection', async () => {
    const failure = new Error('transport unavailable');
    const sendMail = jest.fn().mockRejectedValue(failure);
    const adapter = new NodeMailerAdapter({
      sendMail,
    } as unknown as MailerService);
    await expect(
      adapter.sendMessage({
        to: 'reader@example.test',
        subject: 'Subject',
        text: 'Hello',
      }),
    ).rejects.toBe(failure);
    expect(sendMail).toHaveBeenCalledWith({
      to: 'reader@example.test',
      subject: 'Subject',
      text: 'Hello',
    });
  });
});
