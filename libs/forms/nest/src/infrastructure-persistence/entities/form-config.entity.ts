import { Column, Entity, PrimaryColumn } from 'typeorm';
import { FormConfig } from '@anarchitects/forms-ts/models';
import { FORMS_SCHEMA } from '../schema';

@Entity({ schema: FORMS_SCHEMA, name: 'form_configs' })
export class FormConfigEntity implements FormConfig {
  @PrimaryColumn({ type: 'varchar', length: 100 })
  id!: string;

  @PrimaryColumn({ type: 'int' })
  version!: number;

  @Column({ type: 'jsonb' })
  fields!: FormConfig['fields'];

  @Column({ type: 'jsonb', nullable: true })
  validationRules?: FormConfig['validationRules'];

  @Column({ type: 'jsonb', nullable: true })
  security?: FormConfig['security'];

  @Column({ type: 'jsonb', nullable: true })
  delivery?: FormConfig['delivery'];

  constructor(input?: Partial<FormConfig>) {
    if (input) {
      Object.assign(this, input);
    }
  }
}
