import { Body, Controller, Post } from '@nestjs/common';
import { RouteSchema } from '@nestjs/platform-fastify';
import {
  SubmissionRequestDTO,
  SubmissionRequestSchema,
} from '@anarchitects/forms-ts/dtos';
import { SubmissionsService } from '../../application';

@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post('/submit')
  @RouteSchema({
    body: SubmissionRequestSchema,
  })
  async submitForm(@Body() submissionData: SubmissionRequestDTO) {
    return this.submissionsService.submit(submissionData);
  }
}
