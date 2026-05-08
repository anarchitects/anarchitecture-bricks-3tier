import { ConfigModule } from '@nestjs/config';
import { IdentityModule } from './identity.module';

describe('IdentityModule', () => {
  it('should create a root dynamic module', () => {
    const moduleDefinition = IdentityModule.forRoot();

    expect(moduleDefinition.module).toBe(IdentityModule);
    expect(moduleDefinition.imports).toHaveLength(2);
  });

  it('should include config feature wiring for config-driven setup', () => {
    const moduleDefinition = IdentityModule.forRootFromConfig();

    expect(moduleDefinition.module).toBe(IdentityModule);
    expect(moduleDefinition.imports?.[0]).toMatchObject({
      module: ConfigModule,
    });
  });
});
