import { DynamicModule, Module } from '@nestjs/common';
import type { IdentityInfrastructureModuleOptions } from '../config';

@Module({})
export class IdentityInfrastructureModule {
  static forRoot(
    _options: IdentityInfrastructureModuleOptions = {},
  ): DynamicModule {
    void _options;

    return {
      module: IdentityInfrastructureModule,
    };
  }
}
