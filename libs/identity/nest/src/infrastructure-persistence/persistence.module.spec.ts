import { IdentityInfrastructurePersistenceModule } from './persistence.module';

describe('IdentityInfrastructurePersistenceModule', () => {
  it('creates the persistence module with TypeORM support', () => {
    const moduleMetadata = IdentityInfrastructurePersistenceModule.forRoot();

    expect(moduleMetadata.module).toBe(IdentityInfrastructurePersistenceModule);
    expect(moduleMetadata.imports).toHaveLength(1);
    expect(moduleMetadata.providers).toHaveLength(2);
  });
});
