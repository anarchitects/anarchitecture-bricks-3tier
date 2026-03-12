import { FormsInfrastructurePersistenceModule } from './persistence.module';

const ORIGINAL_FORMS_PERSISTENCE = process.env['FORMS_PERSISTENCE'];

describe('FormsInfrastructurePersistenceModule', () => {
  afterEach(() => {
    if (ORIGINAL_FORMS_PERSISTENCE === undefined) {
      delete process.env['FORMS_PERSISTENCE'];
      return;
    }

    process.env['FORMS_PERSISTENCE'] = ORIGINAL_FORMS_PERSISTENCE;
  });

  it('should use typeorm as fallback when no options are provided to forRoot', () => {
    delete process.env['FORMS_PERSISTENCE'];
    const moduleMetadata = FormsInfrastructurePersistenceModule.forRoot();

    expect(moduleMetadata.module).toBe(FormsInfrastructurePersistenceModule);
  });

  it('should keep forRoot explicit and ignore environment defaults', () => {
    process.env['FORMS_PERSISTENCE'] = 'unsupported';

    const moduleMetadata = FormsInfrastructurePersistenceModule.forRoot({
      persistence: 'typeorm',
    });

    expect(moduleMetadata.module).toBe(FormsInfrastructurePersistenceModule);
  });

  it('should keep forRoot deterministic even when no explicit options are provided', () => {
    process.env['FORMS_PERSISTENCE'] = 'unsupported';

    const moduleMetadata = FormsInfrastructurePersistenceModule.forRoot();

    expect(moduleMetadata.module).toBe(FormsInfrastructurePersistenceModule);
  });

  it('should resolve persistence from env through forRootFromConfig', () => {
    process.env['FORMS_PERSISTENCE'] = 'unsupported';

    expect(() =>
      FormsInfrastructurePersistenceModule.forRootFromConfig(),
    ).toThrow('Unsupported persistence type: unsupported');
  });
});
