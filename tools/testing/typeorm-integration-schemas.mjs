import { EntitySchema, TableForeignKey } from 'typeorm';

export const IDENTITY_AUTH_USER_FOREIGN_KEY =
  'FK_integration_identity_profiles_auth_user';

export const IntegrationAuthUserSchema = new EntitySchema({
  name: 'IntegrationAuthUser',
  tableName: 'users',
  schema: 'auth',
  columns: {
    id: { type: 'uuid', primary: true },
  },
});

export const IntegrationUserProfileSchema = new EntitySchema({
  name: 'IntegrationUserProfile',
  tableName: 'user_profiles',
  schema: 'identity',
  columns: {
    id: { type: 'uuid', primary: true },
    authUserId: { type: 'uuid', name: 'auth_user_id', unique: true },
  },
  relations: {
    authUser: {
      type: 'many-to-one',
      target: 'IntegrationAuthUser',
      joinColumn: { name: 'auth_user_id' },
      onDelete: 'RESTRICT',
      onUpdate: 'CASCADE',
    },
  },
});

export function createIdentityAuthUserForeignKey() {
  return new TableForeignKey({
    name: IDENTITY_AUTH_USER_FOREIGN_KEY,
    columnNames: ['auth_user_id'],
    referencedTableName: 'auth.users',
    referencedColumnNames: ['id'],
    onDelete: 'RESTRICT',
    onUpdate: 'CASCADE',
  });
}
