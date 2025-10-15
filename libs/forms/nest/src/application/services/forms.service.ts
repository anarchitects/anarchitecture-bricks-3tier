import { Injectable } from '@nestjs/common';
import { contactForm } from '@anarchitects/forms-ts/models';
import { schemaFromConfig } from '@anarchitects/forms-ts/builders';

@Injectable()
export class FormsService {
  async getDefinition(formId: string) {
    if (formId === 'contact_default') {
      const config = contactForm;
      const schema = schemaFromConfig(config);
      return { config, schema };
    }
    throw new Error('Unknown form');
  }
}
