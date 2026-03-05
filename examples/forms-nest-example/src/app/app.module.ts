import { randomUUID } from 'node:crypto';
import { Injectable, Module, NotFoundException } from '@nestjs/common';
import {
  FormsController,
  SubmissionsController,
} from '@anarchitects/forms-nest/presentation';
import {
  FormsService,
  SubmissionsService,
} from '@anarchitects/forms-nest/application';
import { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';
import { contactForm } from '@anarchitects/forms-ts/models';
import { schemaFromConfig } from '@anarchitects/forms-ts/builders';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Injectable()
class ExampleFormsService implements Pick<FormsService, 'getDefinition'> {
  async getDefinition(formId: string, version = 1) {
    if (formId !== 'contact_default' || version !== 1) {
      throw new NotFoundException(`Unknown form: ${formId}@${version}`);
    }

    return {
      config: contactForm,
      schema: schemaFromConfig(contactForm),
    };
  }
}

@Injectable()
class ExampleSubmissionsService {
  async submit(submissionData: SubmissionRequestDTO) {
    const now = new Date();

    return {
      id: randomUUID(),
      formId: submissionData.formId,
      formVersion: submissionData.formVersion,
      payload: submissionData.payload,
      createdAt: now,
      updatedAt: now,
    };
  }
}

@Module({
  imports: [],
  controllers: [AppController, FormsController, SubmissionsController],
  providers: [
    AppService,
    {
      provide: FormsService,
      useClass: ExampleFormsService,
    },
    {
      provide: SubmissionsService,
      useClass: ExampleSubmissionsService,
    },
  ],
})
export class AppModule {}
