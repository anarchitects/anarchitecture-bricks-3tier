import {
  SubmissionRequestDTO,
  SubmissionRequestSchema,
  SubmissionResponseSchema,
} from '@anarchitects/forms-ts/dtos';
import { Body, Controller, HttpCode, Post } from '@nestjs/common';
import { RouteSchema } from '@nestjs/platform-fastify';
import { SubmissionsService } from '../../application/services/submissions.service';

@Controller('forms')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Post('/submit')
  @HttpCode(200)
  @RouteSchema({
    body: SubmissionRequestSchema,
    response: {
      200: SubmissionResponseSchema,
    },
  })
  async submitForm(@Body() submissionData: SubmissionRequestDTO) {
    return this.submissionsService.submit(submissionData);
  }
}
