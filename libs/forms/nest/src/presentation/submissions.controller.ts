import { Body, Controller, Param, Post } from '@nestjs/common';
import { RouteSchema } from '@nestjs/platform-fastify';
import { SubmissionRecord, SubmissionsService } from '../application';

@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post('/submit/:formId')
  @RouteSchema({
    body: {},
  })
  async submitForm(
    @Param('formId') formId: string,
    @Body() submissionData: SubmissionRecord
  ) {
    return this.submissionsService.submit(formId, submissionData);
  }
}
