import { Role, User } from '@anarchitects/auth-ts/models';
import {
  BeforeInsert,
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryColumn,
  UpdateDateColumn,
} from 'typeorm';
import { uuidv7 } from 'uuidv7';
import { AUTH_SCHEMA } from '../schema';

@Entity({ schema: AUTH_SCHEMA, name: 'users' })
export class UserEntity implements User {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 255, unique: true })
  email!: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  userName!: string | null;

  @Column({ type: 'varchar', length: 255 })
  passwordHash!: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  token!: string | null;

  @Column({ type: 'boolean', default: false })
  isActive!: boolean;

  @ManyToMany('RoleEntity', 'users', { cascade: ['insert', 'update'] })
  @JoinTable({
    name: 'user_roles',
    schema: AUTH_SCHEMA,
    joinColumn: {
      name: 'user_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'role_id',
      referencedColumnName: 'id',
    },
  })
  roles!: Role[] | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  constructor(partial: Partial<User>) {
    Object.assign(this, partial);
  }

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv7();
    }
  }
}
