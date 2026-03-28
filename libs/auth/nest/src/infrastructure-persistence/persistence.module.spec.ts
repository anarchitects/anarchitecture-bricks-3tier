import { AuthPersistenceModule } from './persistence.module';

describe('AuthPersistenceModule', () => {
  it('uses the canonical TypeORM-backed persistence module for forRoot', () => {
    const moduleMetadata = AuthPersistenceModule.forRoot();

    expect(moduleMetadata.module).toBe(AuthPersistenceModule);
  });

  it('keeps forRootFromConfig deterministic without legacy persistence env handling', () => {
    const moduleMetadata = AuthPersistenceModule.forRootFromConfig();

    expect(moduleMetadata.module).toBe(AuthPersistenceModule);
  });
});
