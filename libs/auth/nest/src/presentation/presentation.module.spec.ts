import { DynamicModule } from '@nestjs/common';
import { AuthApplicationModule } from '../application';
import { JwtAuthPluginController } from '../infrastructure-engine/better-auth/plugins/jwt/jwt-auth-plugin.controller';
import { AuthPresentationModule } from './presentation.module';

describe('AuthPresentationModule', () => {
  it('composes application forRoot options when overrides are provided', () => {
    const moduleMetadata = AuthPresentationModule.forRoot({
      application: {
        encryption: {
          algorithm: 'bcrypt',
          key: 'presentation-key',
        },
      },
    });

    expect(moduleMetadata.module).toBe(AuthPresentationModule);
    const [applicationImport] = moduleMetadata.imports as DynamicModule[];
    expect(applicationImport.module).toBe(AuthApplicationModule);
  });

  it('mounts the JWT plugin controller only when the plugin is enabled', () => {
    const enabled = AuthPresentationModule.forRoot({
      application: {
        plugins: {
          jwt: { enabled: true },
        },
      },
    });
    const disabled = AuthPresentationModule.forRoot({
      application: {
        plugins: {
          jwt: { enabled: false },
        },
      },
    });

    expect(enabled.controllers).toContain(JwtAuthPluginController);
    expect(disabled.controllers).toEqual([]);
  });

  it('merges config-backed plugin overrides through forRootFromConfig', () => {
    const moduleMetadata = AuthPresentationModule.forRootFromConfig({
      application: {
        plugins: {
          jwt: { enabled: true },
        },
      },
    });

    expect(moduleMetadata.module).toBe(AuthPresentationModule);
    expect(moduleMetadata.controllers).toContain(JwtAuthPluginController);
  });
});
