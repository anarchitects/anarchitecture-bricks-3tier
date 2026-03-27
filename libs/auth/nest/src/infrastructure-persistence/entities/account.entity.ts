import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { AUTH_SCHEMA } from '../schema';

@Entity({ schema: AUTH_SCHEMA, name: 'accounts' })
@Index('IDX_auth_accounts_userId', ['userId'])
@Index('UQ_auth_accounts_provider_account', ['providerId', 'accountId'], {
  unique: true,
})
export class AccountEntity {
  @PrimaryColumn({ type: 'varchar', length: 255 })
  id!: string;

  @Column({ type: 'varchar', length: 255 })
  accountId!: string;

  @Column({ type: 'varchar', length: 255 })
  providerId!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'text', nullable: true })
  accessToken!: string | null;

  @Column({ type: 'text', nullable: true })
  refreshToken!: string | null;

  @Column({ type: 'text', nullable: true })
  idToken!: string | null;

  @Column({ type: 'timestamptz', nullable: true })
  accessTokenExpiresAt!: Date | null;

  @Column({ type: 'timestamptz', nullable: true })
  refreshTokenExpiresAt!: Date | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  scope!: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  password!: string | null;

  @CreateDateColumn({ type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ type: 'timestamptz' })
  updatedAt!: Date;
}
