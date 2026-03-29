import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';
import { AUTH_SCHEMA } from '../../../../infrastructure-persistence/schema';

@Entity({ schema: AUTH_SCHEMA, name: 'passkeys' })
@Index('IDX_auth_passkeys_userId', ['userId'])
@Index('UQ_auth_passkeys_credentialID', ['credentialID'], { unique: true })
export class PasskeyEntity {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  id!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name!: string | null;

  @Column({ type: 'text' })
  publicKey!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'varchar', length: 500 })
  credentialID!: string;

  @Column({ type: 'integer' })
  counter!: number;

  @Column({ type: 'varchar', length: 100 })
  deviceType!: string;

  @Column({ type: 'boolean' })
  backedUp!: boolean;

  @Column({ type: 'varchar', length: 500, nullable: true })
  transports!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @Column({ type: 'varchar', length: 255, nullable: true })
  aaguid!: string | null;

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv7();
    }
  }
}
