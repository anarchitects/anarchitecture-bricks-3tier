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

  it('should use typeorm fallback when no options are provided to forRoot', () => {
    delete process.env['AUTH_PERSISTENCE'];
    const moduleMetadata = AuthPersistenceModule.forRoot();

    expect(moduleMetadata.module).toBe(AuthPersistenceModule);
  });

  it('should keep forRoot explicit and ignore AUTH_PERSISTENCE', () => {
    process.env['AUTH_PERSISTENCE'] = 'unsupported';
    const moduleMetadata = AuthPersistenceModule.forRoot();

    expect(moduleMetadata.module).toBe(AuthPersistenceModule);
  });

  it('should resolve AUTH_PERSISTENCE through forRootFromConfig', () => {
    process.env['AUTH_PERSISTENCE'] = 'unsupported';

    expect(() => AuthPersistenceModule.forRootFromConfig()).toThrow(
      'Unsupported persistence type: unsupported',
    );
  });
});
