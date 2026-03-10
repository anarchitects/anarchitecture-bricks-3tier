import { Injectable } from '@nestjs/common';
import { FormConfig } from '@anarchitects/forms-ts/models';

@Injectable()
export abstract class FormConfigsRepository {
  abstract getFormConfig(
    formId: string,
    formVersion: number,
  ): Promise<FormConfig>;
}
