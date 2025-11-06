import { Column, Entity, Index, PrimaryColumn } from 'typeorm';
import { AUTH_SCHEMA } from '../schema';

@Entity({
  schema: AUTH_SCHEMA,
  name: 'invalidated_tokens',
  synchronize: false,
})
@Index('invalidated_tokens_expires_at_idx', ['expiresAt'])
export class InvalidatedTokenEntity {
  @PrimaryColumn({ type: 'varchar', length: 128 })
  tokenId!: string;

  @Column({ type: 'uuid', nullable: true })
  userId!: string | null;

  @Column({ type: 'timestamptz', name: 'expires_at' })
  expiresAt!: Date;

  @Column({
    type: 'timestamptz',
    name: 'invalidated_at',
    default: () => 'CURRENT_TIMESTAMP',
  })
  invalidatedAt!: Date;

  constructor(partial: Partial<InvalidatedTokenEntity> = {}) {
    Object.assign(this, partial);
  }
}
