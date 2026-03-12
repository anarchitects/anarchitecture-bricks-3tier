import { DynamicModule } from '@nestjs/common';
import { AuthApplicationModule } from './application.module';
import { AuthPersistenceModule } from '../infrastructure-persistence';
import { AuthService } from './services/auth.service';

const ORIGINAL_AUTH_PERSISTENCE = process.env['AUTH_PERSISTENCE'];
const ORIGINAL_AUTH_STRATEGIES = process.env['AUTH_STRATEGIES'];

describe('AuthApplicationModule', () => {
  afterEach(() => {
    if (ORIGINAL_AUTH_PERSISTENCE === undefined) {
      delete process.env['AUTH_PERSISTENCE'];
    } else {
      process.env['AUTH_PERSISTENCE'] = ORIGINAL_AUTH_PERSISTENCE;
    }

    if (ORIGINAL_AUTH_STRATEGIES === undefined) {
      delete process.env['AUTH_STRATEGIES'];
    } else {
      process.env['AUTH_STRATEGIES'] = ORIGINAL_AUTH_STRATEGIES;
    }
  });

  it('should compose persistence forRoot options when overrides are provided', () => {
    const moduleMetadata = AuthApplicationModule.forRoot({
      authStrategies: ['jwt'],
      encryption: {
        algorithm: 'bcrypt',
        key: 'explicit-key',
      },
      persistence: { persistence: 'typeorm' },
    });

    expect(moduleMetadata.module).toBe(AuthApplicationModule);
    const [configImport, persistenceImport] =
      moduleMetadata.imports as DynamicModule[];
    expect(configImport).toBeDefined();
    expect(persistenceImport.module).toBe(AuthPersistenceModule);
  });

  it('should resolve AUTH_PERSISTENCE through forRootFromConfig', () => {
    process.env['AUTH_PERSISTENCE'] = 'unsupported';

    expect(() => AuthApplicationModule.forRootFromConfig()).toThrow(
      'Unsupported persistence type: unsupported',
    );
  });

  it('should let explicit forRootFromConfig overrides win over env defaults', () => {
    process.env['AUTH_PERSISTENCE'] = 'unsupported';

    const moduleMetadata = AuthApplicationModule.forRootFromConfig({
      persistence: { persistence: 'typeorm' },
    });

    expect(moduleMetadata.module).toBe(AuthApplicationModule);
  });

  it('should keep forRoot explicit and ignore AUTH_STRATEGIES', () => {
    process.env['AUTH_STRATEGIES'] = 'custom';
    const moduleMetadata = AuthApplicationModule.forRoot({
      encryption: {
        algorithm: 'bcrypt',
        key: 'explicit-key',
      },
    });

    expect(moduleMetadata.exports).toContain(AuthService);
  });

  it('should resolve AUTH_STRATEGIES through forRootFromConfig', () => {
    process.env['AUTH_STRATEGIES'] = 'custom';
    const moduleMetadata = AuthApplicationModule.forRootFromConfig();

    expect(moduleMetadata.exports).not.toContain(AuthService);
  });
});
