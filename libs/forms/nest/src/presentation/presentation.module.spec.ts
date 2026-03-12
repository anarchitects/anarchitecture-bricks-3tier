import { DynamicModule } from '@nestjs/common';
import { FormsApplicationModule } from '../application';
import { FormsPresentationModule } from './presentation.module';

const ORIGINAL_FORMS_PERSISTENCE = process.env['FORMS_PERSISTENCE'];

describe('FormsPresentationModule', () => {
  afterEach(() => {
    if (ORIGINAL_FORMS_PERSISTENCE === undefined) {
      delete process.env['FORMS_PERSISTENCE'];
      return;
    }

    process.env['FORMS_PERSISTENCE'] = ORIGINAL_FORMS_PERSISTENCE;
  });

  it('should return default module metadata when no overrides are provided', () => {
    const moduleMetadata = FormsPresentationModule.forRoot();

    expect(moduleMetadata).toEqual({
      module: FormsPresentationModule,
    });
  });

  it('should compose application forRoot options when overrides are provided', () => {
    const moduleMetadata = FormsPresentationModule.forRoot({
      application: {
        persistence: { persistence: 'typeorm' },
      },
    });

    expect(moduleMetadata.module).toBe(FormsPresentationModule);
    const [applicationImport] = moduleMetadata.imports as DynamicModule[];
    expect(applicationImport.module).toBe(FormsApplicationModule);
  });

  it('should resolve env-backed application persistence through forRootFromConfig', () => {
    process.env['FORMS_PERSISTENCE'] = 'unsupported';

    expect(() => FormsPresentationModule.forRootFromConfig()).toThrow(
      'Unsupported persistence type: unsupported',
    );
  });
});
