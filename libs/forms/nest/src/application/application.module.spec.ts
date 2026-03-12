import { DynamicModule } from '@nestjs/common';
import { FormsApplicationModule } from './application.module';
import { FormsInfrastructurePersistenceModule } from '../infrastructure-persistence';

const ORIGINAL_FORMS_PERSISTENCE = process.env['FORMS_PERSISTENCE'];

describe('FormsApplicationModule', () => {
  afterEach(() => {
    if (ORIGINAL_FORMS_PERSISTENCE === undefined) {
      delete process.env['FORMS_PERSISTENCE'];
      return;
    }

    process.env['FORMS_PERSISTENCE'] = ORIGINAL_FORMS_PERSISTENCE;
  });

  it('should return default module metadata when no overrides are provided', () => {
    const moduleMetadata = FormsApplicationModule.forRoot();

    expect(moduleMetadata).toEqual({
      module: FormsApplicationModule,
    });
  });

  it('should compose persistence forRoot options when overrides are provided', () => {
    const moduleMetadata = FormsApplicationModule.forRoot({
      persistence: { persistence: 'typeorm' },
    });

    expect(moduleMetadata.module).toBe(FormsApplicationModule);
    const [persistenceImport] = moduleMetadata.imports as DynamicModule[];
    expect(persistenceImport.module).toBe(FormsInfrastructurePersistenceModule);
  });

  it('should resolve env persistence through forRootFromConfig', () => {
    process.env['FORMS_PERSISTENCE'] = 'unsupported';

    expect(() => FormsApplicationModule.forRootFromConfig()).toThrow(
      'Unsupported persistence type: unsupported',
    );
  });

  it('should let explicit forRootFromConfig overrides win over env defaults', () => {
    process.env['FORMS_PERSISTENCE'] = 'unsupported';

    const moduleMetadata = FormsApplicationModule.forRootFromConfig({
      persistence: { persistence: 'typeorm' },
    });

    expect(moduleMetadata.module).toBe(FormsApplicationModule);
  });
});
