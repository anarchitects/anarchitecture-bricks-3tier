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
