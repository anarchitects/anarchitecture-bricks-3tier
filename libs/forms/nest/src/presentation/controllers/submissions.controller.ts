import {
  SubmissionRequestDTO,
  SubmissionRequestSchema,
  SubmissionResponseSchema,
  SubmissionIdParamsDTO,
  SubmissionIdParamsSchema,
  SubmissionsQueryDTO,
  SubmissionsQuerySchema,
  SubmissionsResponseSchema,
} from '@anarchitects/forms-ts/dtos';
import { toSubmissionResponseDTO } from '@anarchitects/forms-ts/mappers';
import {
  Body,
  Controller,
  Get,
  HttpCode,
  Param,
  Post,
  Query,
} from '@nestjs/common';
import { RouteSchema } from '@nestjs/platform-fastify';
import { SubmissionsService } from '../../application/services/submissions.service';

@Controller('forms')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  @Get('/submissions')
  @RouteSchema({
    querystring: SubmissionsQuerySchema,
    response: { 200: SubmissionsResponseSchema },
  })
  async getSubmissions(@Query() query: SubmissionsQueryDTO) {
    const submissions = await this.submissionsService.getSubmissions(query);
    return submissions.map(toSubmissionResponseDTO);
  }

  @Get('/submissions/:submissionId')
  @RouteSchema({
    params: SubmissionIdParamsSchema,
    response: { 200: SubmissionResponseSchema },
  })
  async getSubmission(@Param() params: SubmissionIdParamsDTO) {
    const submission = await this.submissionsService.getSubmission(
      params.submissionId,
    );
    return toSubmissionResponseDTO(submission);
  }

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
