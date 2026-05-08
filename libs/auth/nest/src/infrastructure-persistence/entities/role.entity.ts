import { Permission, Role, User } from '@anarchitects/auth-ts/models';
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
import { AUTH_SCHEMA } from '../schema';
import { uuidv7 } from 'uuidv7';

@Entity({ schema: AUTH_SCHEMA, name: 'roles' })
export class RoleEntity implements Role {
  @PrimaryColumn('uuid')
  id!: string;

  @Column({ type: 'varchar', length: 100, unique: true })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description!: string | null;

  @ManyToMany('PermissionEntity', 'roles')
  @JoinTable({
    name: 'role_permissions',
    schema: AUTH_SCHEMA,
    joinColumn: {
      name: 'role_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'permission_id',
      referencedColumnName: 'id',
    },
  })
  permissions!: Permission[] | null;

  @ManyToMany('AuthUserEntity', 'roles')
  users!: User[] | null;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;

  constructor(partial: Partial<Role>) {
    Object.assign(this, partial);
  }

  @BeforeInsert()
  generateId() {
    if (!this.id) {
      this.id = uuidv7();
    }
  }
}
