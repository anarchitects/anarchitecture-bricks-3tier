import { UserProfile } from '@anarchitects/identity-ts/models';
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
import { IDENTITY_SCHEMA } from '../schema';

@Entity({ schema: IDENTITY_SCHEMA, name: 'user_profiles' })
@Index('uq_identity_user_profiles_auth_user_id', ['authUserId'], {
  unique: true,
})
export class UserProfileEntity implements UserProfile {
  @PrimaryColumn('uuid')
  id!: string;

  @Column('uuid', { name: 'auth_user_id' })
  authUserId!: string;

  @Column({
    name: 'display_name',
    type: 'varchar',
    length: 150,
    nullable: true,
  })
  displayName!: string | null;

  @Column({ name: 'given_name', type: 'varchar', length: 100, nullable: true })
  givenName!: string | null;

  @Column({ name: 'family_name', type: 'varchar', length: 100, nullable: true })
  familyName!: string | null;

  @Column({ name: 'avatar_url', type: 'varchar', length: 500, nullable: true })
  avatarUrl!: string | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  locale!: string | null;

  @Column({ name: 'time_zone', type: 'varchar', length: 100, nullable: true })
  timeZone!: string | null;

  @CreateDateColumn({ name: 'created_at', type: 'timestamptz' })
  createdAt!: Date;

  @UpdateDateColumn({ name: 'updated_at', type: 'timestamptz' })
  updatedAt!: Date;

  constructor(input?: Partial<UserProfile>) {
    if (input) {
      Object.assign(this, input);
    }
  }

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv7();
    }
  }
}
