import { Controller, Get, Param } from '@nestjs/common';
import { FormsService } from '../application';

@Controller('forms')
export class FormsController {
  constructor(private readonly formsService: FormsService) {}

  @Get(':formId')
  getFormDefinition(@Param('formId') formId: string) {
    return this.formsService.getDefinition(formId);
  }
}
