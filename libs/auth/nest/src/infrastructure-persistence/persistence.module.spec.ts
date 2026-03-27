import { AuthPersistenceModule } from './persistence.module';

const ORIGINAL_AUTH_PERSISTENCE = process.env['AUTH_PERSISTENCE'];

describe('AuthPersistenceModule', () => {
  afterEach(() => {
    if (ORIGINAL_AUTH_PERSISTENCE === undefined) {
      delete process.env['AUTH_PERSISTENCE'];
      return;
    }

    process.env['AUTH_PERSISTENCE'] = ORIGINAL_AUTH_PERSISTENCE;
  });

  it('uses the canonical TypeORM-backed persistence module for forRoot', () => {
    delete process.env['AUTH_PERSISTENCE'];

    const moduleMetadata = AuthPersistenceModule.forRoot();

    expect(moduleMetadata.module).toBe(AuthPersistenceModule);
  });

  it('keeps forRoot explicit and ignores legacy AUTH_PERSISTENCE values', () => {
    process.env['AUTH_PERSISTENCE'] = 'unsupported';

    const moduleMetadata = AuthPersistenceModule.forRoot();

    expect(moduleMetadata.module).toBe(AuthPersistenceModule);
  });

  it('keeps forRootFromConfig compatible with legacy AUTH_PERSISTENCE env values', () => {
    process.env['AUTH_PERSISTENCE'] = 'unsupported';

    const moduleMetadata = AuthPersistenceModule.forRootFromConfig();

    expect(moduleMetadata.module).toBe(AuthPersistenceModule);
  });
});
