import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { IdentityPresentationModule } from './presentation';
import { IdentityInfrastructureModule } from './infrastructure';
import {
  identityConfig,
  mapIdentityConfigToIdentityModuleOptions,
} from './config';
import type { IdentityModuleOptions } from './config';

@Module({})
export class IdentityModule {
  static forRoot(options: IdentityModuleOptions = {}): DynamicModule {
    const presentationModule = IdentityPresentationModule.forRoot(
      options.presentation,
    );
    const infrastructureModule = IdentityInfrastructureModule.forRoot(
      options.infrastructure,
    );

    return {
      module: IdentityModule,
      imports: [presentationModule, infrastructureModule],
      exports: [presentationModule, infrastructureModule],
    };
  }

  static forRootFromConfig(
    overrides: IdentityModuleOptions = {},
  ): DynamicModule {
    const configOptions = mapIdentityConfigToIdentityModuleOptions(
      identityConfig(),
    );

    const moduleDefinition = this.forRoot({
      presentation: {
        ...configOptions.presentation,
        ...overrides.presentation,
      },
      infrastructure: { ...configOptions.infrastructure, ...overrides.infrastructure },
    });

    return {
      ...moduleDefinition,
      imports: [
        ConfigModule.forFeature(identityConfig),
        ...(moduleDefinition.imports ?? []),
      ],
    };
  }
}
