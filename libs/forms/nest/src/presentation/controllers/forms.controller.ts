import {
  FormDefinitionEnvelopeResponseSchema,
  FormIdParamsSchema,
} from '@anarchitects/forms-ts/dtos';
import { Controller, Get, Param } from '@nestjs/common';
import { RouteSchema } from '@nestjs/platform-fastify';
import { FormsService } from '../../application/services/forms.service';

@Controller('forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Get(':formId')
  @RouteSchema({
    params: FormIdParamsSchema,
    response: {
      200: FormDefinitionEnvelopeResponseSchema,
    },
  })
  getFormDefinition(@Param('formId') formId: string) {
    return this.formsService.getDefinition(formId);
  }
}
