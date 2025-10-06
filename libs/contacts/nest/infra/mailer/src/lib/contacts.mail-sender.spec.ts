import { Test, TestingModule } from '@nestjs/testing';
import { NestContactsMailSender } from './contacts.mail-sender';
import { MailerService } from '@nestjs-modules/mailer';
import { faker } from '@faker-js/faker';
import { contactsMailerConfig, ContactsMailerConfig } from './config';

describe('NestContactsMailSender', () => {
  let provider: NestContactsMailSender;

  const mockContact = {
    name: faker.person.fullName(),
    email: faker.internet.email(),
    message: faker.lorem.sentence(),
  };

  const mockMailerService = {
    sendMail: jest.fn().mockResolvedValue(undefined),
  };

  const mockConfig: ContactsMailerConfig = {
    templateIn: 'path/to/template',
    templateOut: 'path/to/output',
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NestContactsMailSender],
    })
      .useMocker((token) => {
        if (token === MailerService) {
          return mockMailerService;
        }
        if (token === contactsMailerConfig.KEY) {
          return mockConfig;
        }
        return undefined;
      })
      .compile();

    provider = module.get<NestContactsMailSender>(NestContactsMailSender);
  });

  it('should be defined', () => {
    expect(provider).toBeDefined();
  });
  describe('sendMail', () => {
    it('should send an email', async () => {
      await provider.sendMail(
        mockContact.name,
        mockContact.email,
        mockContact.message
      );
      expect(mockMailerService.sendMail).toHaveBeenCalledTimes(2);
    });
  });
});
