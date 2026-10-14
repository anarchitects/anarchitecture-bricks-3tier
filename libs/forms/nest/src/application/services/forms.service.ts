import type { FormDefinitionEnvelopeModel } from '@anarchitects/forms-ts/mappers';
import { Injectable } from '@nestjs/common';
import { schemaFromConfig } from '@anarchitects/forms-ts/builders';
import { FormConfigsRepository } from '../../infrastructure-persistence';

@Injectable()
export class FormsService {
  constructor(private readonly formConfigsRepository: FormConfigsRepository) {}

  async getDefinition(
    formId: string,
    version = 1,
  ): Promise<FormDefinitionEnvelopeModel> {
    const config = await this.formConfigsRepository.getFormConfig(
      formId,
      version,
    );
    const schema = schemaFromConfig(config);
    return { config, schema };
  }
}
