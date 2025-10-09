import type { Contact } from '@anarchitects/contacts-ts/models';
import {
  Column,
  CreateDateColumn,
  Entity,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';

@Entity()
export class ContactEntity implements Contact {
  @PrimaryColumn('uuid')
  id: string = uuidv7();

  @Column()
  name!: string;

  @Column()
  email!: string;

  @Column()
  message!: string;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  constructor(partial: Partial<Contact>) {
    Object.assign(this, partial);
  }
}
