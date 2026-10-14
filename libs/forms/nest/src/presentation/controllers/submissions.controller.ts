import type { Submission } from '@anarchitects/forms-ts/models';
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
  BadRequestException,
  NotFoundException,
  InternalServerErrorException,
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
  async submitForm(
    @Body() submissionData: SubmissionRequestDTO,
  ): Promise<Submission> {
    try {
      return await this.submissionsService.submit(submissionData);
    } catch (error) {
      if (error instanceof BadRequestException)
        throw new BadRequestException('Invalid form submission.');
      if (error instanceof NotFoundException)
        throw new NotFoundException('Form definition not found.');
      throw new InternalServerErrorException(
        'Unable to process form submission.',
      );
    }
  }
}
