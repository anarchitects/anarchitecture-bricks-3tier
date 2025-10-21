import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';
import { Submission } from '@anarchitects/forms-ts/models';
import { FORMS_SCHEMA } from '../schema';

@Entity({ schema: FORMS_SCHEMA, name: 'form_submissions' })
export class SubmissionEntity implements Submission {
  @Index(['formId', 'formVersion'], { unique: true })
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ length: 100 })
  formId!: string;

  @Column({ type: 'int' })
  formVersion!: number;

  @Column({ type: 'jsonb' })
  payload!: Record<string, unknown>;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv7();
    }
  }

  constructor(input?: Partial<Submission>) {
    if (input) {
      Object.assign(this, input);
    }
  }
}
