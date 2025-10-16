import { Injectable } from '@nestjs/common';
import { contactForm } from '@anarchitects/forms-ts/models';
import { schemaFromConfig } from '@anarchitects/forms-ts/builders';

@Injectable()
export class FormsService {
  async getDefinition(formId: string, version = 1) {
    if (formId === 'contact_default' && version === 1) {
      const config = contactForm;
      const schema = schemaFromConfig(config);
      return { config, schema };
    }
    throw new Error('Unknown form');
  }
}
