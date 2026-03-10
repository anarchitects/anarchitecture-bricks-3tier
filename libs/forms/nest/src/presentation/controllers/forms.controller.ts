import {
  FormDefinitionEnvelopeResponseSchema,
  FormDefinitionQueryDTO,
  FormDefinitionQuerySchema,
  FormIdParamsSchema,
} from '@anarchitects/forms-ts/dtos';
import { Controller, Get, Param, Query } from '@nestjs/common';
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
      200: FormDefinitionEnvelopeResponseSchema,
    },
  })
  getFormDefinition(
    @Param('formId') formId: string,
    @Query() query: FormDefinitionQueryDTO,
  ) {
    return this.formsService.getDefinition(formId, query?.formVersion ?? 1);
  }
}
