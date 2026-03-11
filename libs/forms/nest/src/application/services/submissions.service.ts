import { Inject, Injectable, Optional } from '@nestjs/common';
import { MailerPort } from '@anarchitects/common-nest-mailer';
import { SubmissionsRepository } from '../../infrastructure-persistence/repositories/submissions.repository';
import { Submission } from '@anarchitects/forms-ts/models';
import { FormsService } from './forms.service';

const NOOP_MAILER_PORT: MailerPort = {
  send: async () => undefined,
  sendTemplate: async () => undefined,
};

@Injectable()
export class SubmissionsService {
  constructor(
    private readonly repo: SubmissionsRepository,
    @Optional()
    @Inject(MailerPort)
    private readonly mailer: MailerPort | undefined,
    private readonly formsService: FormsService,
  ) {}

  async submit(input: Partial<Submission>) {
    const { formId, formVersion = 1 } = input;
    if (!formId) {
      throw new Error('Form ID is required');
    }
    const { config } = await this.formsService.getDefinition(
      formId,
      formVersion,
    );
    const rec = await this.repo.createSubmission(input);
    const mailer = this.mailer ?? NOOP_MAILER_PORT;

    // send email to site admin
    if (config.delivery?.adminEmail) {
      if (config.delivery?.templateId) {
        await mailer.sendTemplate(
          config.delivery.adminEmail,
          config.delivery?.subject ?? 'New form submission',
          config.delivery?.templateId ?? 'default',
          input.payload,
        );
      } else {
        await mailer.send(
          config.delivery.adminEmail,
          config.delivery?.subject ?? 'New form submission',
          `A new submission has been received for form ${formId}.\n\nPayload:\n${JSON.stringify(
            input.payload,
            null,
            2,
          )}`,
        );
      }
    }
    // send auto-reply to user if enabled
    if (config.delivery?.autoReply?.enabled) {
      const recipientEmail = input.payload?.['email'];
      if (typeof recipientEmail !== 'string') {
        throw new Error('Auto-reply requires a recipient email address.');
      }
      if (config.delivery.autoReply.templateId) {
        await mailer.sendTemplate(
          recipientEmail,
          config.delivery.autoReply?.subject ?? 'Thank you for your submission',
          config.delivery.autoReply.templateId,
          input.payload,
        );
      } else {
        await mailer.send(
          recipientEmail,
          config.delivery.autoReply?.subject ?? 'Thank you for your submission',
          `Thank you for your submission. We will get back to you shortly.`,
        );
      }
    }
    return rec;
  }
}
