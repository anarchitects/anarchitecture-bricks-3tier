import { DynamicModule, Module } from '@nestjs/common';
import type { IdentityApplicationModuleOptions } from '../config';

@Module({})
export class IdentityApplicationModule {
  static forRoot(
    _options: IdentityApplicationModuleOptions = {},
  ): DynamicModule {
    void _options;

    return {
      module: IdentityApplicationModule,
    };
  }
}
