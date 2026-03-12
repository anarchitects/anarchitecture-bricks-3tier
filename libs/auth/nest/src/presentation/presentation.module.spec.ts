import { DynamicModule } from '@nestjs/common';
import { AuthApplicationModule } from '../application';
import { AuthPresentationModule } from './presentation.module';

const ORIGINAL_AUTH_PERSISTENCE = process.env['AUTH_PERSISTENCE'];

describe('AuthPresentationModule', () => {
  afterEach(() => {
    if (ORIGINAL_AUTH_PERSISTENCE === undefined) {
      delete process.env['AUTH_PERSISTENCE'];
      return;
    }

    process.env['AUTH_PERSISTENCE'] = ORIGINAL_AUTH_PERSISTENCE;
  });

  it('should compose application forRoot options when overrides are provided', () => {
    const moduleMetadata = AuthPresentationModule.forRoot({
      application: {
        authStrategies: ['jwt'],
        encryption: {
          algorithm: 'bcrypt',
          key: 'presentation-key',
        },
        persistence: { persistence: 'typeorm' },
      },
    });

    expect(moduleMetadata.module).toBe(AuthPresentationModule);
    const [applicationImport] = moduleMetadata.imports as DynamicModule[];
    expect(applicationImport.module).toBe(AuthApplicationModule);
  });

  it('should resolve env-backed persistence through forRootFromConfig', () => {
    process.env['AUTH_PERSISTENCE'] = 'unsupported';

    expect(() => AuthPresentationModule.forRootFromConfig()).toThrow(
      'Unsupported persistence type: unsupported',
    );
  });
});
