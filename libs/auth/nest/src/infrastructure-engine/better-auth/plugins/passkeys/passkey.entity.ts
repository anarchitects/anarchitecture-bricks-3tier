import {
  BeforeInsert,
  Check,
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
} from 'typeorm';
import { passkeyCounterTransformer } from './passkey-counter.transformer';
import { uuidv7 } from 'uuidv7';
import { AUTH_SCHEMA } from '../../../../infrastructure-persistence/schema';

@Entity({ schema: AUTH_SCHEMA, name: 'passkeys' })
@Index('IDX_auth_passkeys_userId', ['userId'])
@Index('UQ_auth_passkeys_credentialID', ['credentialID'], { unique: true })
@Check(
  'CHK_auth_passkeys_counter_uint32',
  '"counter" >= 0 AND "counter" <= 4294967295',
)
export class PasskeyEntity {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  id!: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  name!: string | null;

  @Column({ type: 'text' })
  publicKey!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  // WebAuthn permits 1023 credential ID bytes (1364 unpadded base64url characters).
  @Column({ type: 'varchar', length: 1364 })
  credentialID!: string;

  @Column({ type: 'bigint', transformer: passkeyCounterTransformer })
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
