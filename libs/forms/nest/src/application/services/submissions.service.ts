import { Injectable } from '@nestjs/common';
import { SubmissionsRepository } from '../../infrastructure-persistence/repositories/submissions.repository';
import { MailerAdapter } from '../../infrastructure-mailer/adapters/mailer.adapter';
import { Submission } from '@anarchitects/forms-ts/models';
import { FormsService } from './forms.service';

@Injectable()
export class SubmissionsService {
  constructor(
    private readonly repo: SubmissionsRepository,
    private readonly mailer: MailerAdapter,
    private readonly formsService: FormsService
  ) {}

  async submit(input: Partial<Submission>) {
    const { formId, formVersion = 1 } = input;
    if (!formId) {
      throw new Error('Form ID is required');
    }
    const { config } = await this.formsService.getDefinition(
      formId,
      formVersion
    );
    const rec = await this.repo.createSubmission(input);
    // send email to site admin
    if (config.delivery?.adminEmail) {
      if (config.delivery?.templateId) {
        await this.mailer.sendTemplate(
          config.delivery.adminEmail,
          config.delivery?.subject ?? 'New form submission',
          config.delivery?.templateId ?? 'default',
          input.payload
        );
      } else {
        await this.mailer.send(
          config.delivery.adminEmail,
          config.delivery?.subject ?? 'New form submission',
          `A new submission has been received for form ${formId}.\n\nPayload:\n${JSON.stringify(
            input.payload,
            null,
            2
          )}`
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
        await this.mailer.sendTemplate(
          recipientEmail,
          config.delivery.autoReply?.subject ?? 'Thank you for your submission',
          config.delivery.autoReply.templateId,
          input.payload
        );
      } else {
        await this.mailer.send(
          recipientEmail,
          config.delivery.autoReply?.subject ?? 'Thank you for your submission',
          `Thank you for your submission. We will get back to you shortly.`
        );
      }
    }
    return rec;
  }
}
