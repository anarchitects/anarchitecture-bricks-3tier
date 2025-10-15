import { Inject, Injectable } from '@nestjs/common';
import {
  SUBMISSIONS_REPOSITORY,
  SubmissionsRepository,
} from '../ports/submissions.repository.port';
import { MAILER_PORT, MailerPort } from '../ports/mailer.port';
import { SubmissionRecord } from '../types/submission-record.type';
import { FormsService } from './forms.service';

@Injectable()
export class SubmissionsService {
  constructor(
    @Inject(SUBMISSIONS_REPOSITORY)
    private readonly repo: SubmissionsRepository,
    @Inject(MAILER_PORT) private readonly mailer: MailerPort,
    private readonly formsService: FormsService
  ) {}

  async submit(formId: string, input: SubmissionRecord) {
    const { config } = await this.formsService.getDefinition(formId);
    const rec = await this.repo.createSubmission(input);
    // send email to site admin
    if (config.delivery?.adminEmail) {
      await this.mailer.sendTemplate(
        config.delivery.adminEmail,
        config.delivery?.subject ?? 'New form submission',
        config.delivery?.templateId ?? 'default',
        input.payload
      );
    }
    // send auto-reply to user if enabled
    if (config.delivery?.autoReply?.enabled) {
      const recipientEmail = input.payload['email'];
      if (typeof recipientEmail !== 'string') {
        throw new Error('Auto-reply requires a recipient email address.');
      }
      await this.mailer.sendTemplate(
        recipientEmail,
        config.delivery.autoReply?.subject ?? 'Thank you for your submission',
        config.delivery.autoReply.templateId,
        input.payload
      );
    }
    return rec.id;
  }
}
