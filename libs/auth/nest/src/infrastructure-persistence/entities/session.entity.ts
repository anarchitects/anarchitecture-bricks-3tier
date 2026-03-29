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
import { AUTH_SCHEMA } from '../schema';

@Entity({ schema: AUTH_SCHEMA, name: 'sessions' })
@Index('IDX_auth_sessions_userId', ['userId'])
export class SessionEntity {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'timestamptz' })
  expiresAt!: Date;

  @Column({ type: 'varchar', length: 500, unique: true })
  token!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  ipAddress!: string | null;

  @Column({ type: 'varchar', length: 1000, nullable: true })
  userAgent!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv7();
    }
  }
}
