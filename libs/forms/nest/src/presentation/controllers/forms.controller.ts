import {
  PublicFormDefinitionEnvelopeResponseSchema,
  FormDefinitionQueryDTO,
  FormDefinitionQuerySchema,
  FormIdParamsSchema,
} from '@anarchitects/forms-ts/dtos';
import { toPublicFormDefinitionEnvelopeResponseDTO } from '@anarchitects/forms-ts/mappers';
import {
  Controller,
  Get,
  Param,
  Query,
  InternalServerErrorException,
  NotFoundException,
} from '@nestjs/common';
import { RouteSchema } from '@nestjs/platform-fastify';
import { FormsService } from '../../application/services/forms.service';

@Controller('forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Get(':formId')
  @RouteSchema({
    params: FormIdParamsSchema,
    querystring: FormDefinitionQuerySchema,
    response: {
      200: PublicFormDefinitionEnvelopeResponseSchema,
    },
  })
  async getFormDefinition(
    @Param('formId') formId: string,
    @Query() query: FormDefinitionQueryDTO,
  ) {
    try {
      const definition = await this.formsService.getDefinition(
        formId,
        query?.formVersion ?? 1,
      );
      return toPublicFormDefinitionEnvelopeResponseDTO(definition);
    } catch (error) {
      if (error instanceof NotFoundException)
        throw new NotFoundException('Form definition not found.');
      // Configuration/adapter failures must not echo delivery settings in errors or logs.
      throw new InternalServerErrorException('Unable to read form definition.');
    }
  }
}
