import { DynamicModule, Module } from '@nestjs/common';
import { IdentityApplicationModule } from '../application';
import type { IdentityPresentationModuleOptions } from '../config';
import { UserProfilesController } from './controllers/user-profiles.controller';

@Module({
  imports: [IdentityApplicationModule.forRoot()],
  controllers: [UserProfilesController],
  exports: [IdentityApplicationModule],
})
export class IdentityPresentationModule {
  static forRoot(
    options: IdentityPresentationModuleOptions = {},
  ): DynamicModule {
    const applicationModule = IdentityApplicationModule.forRoot(
      options.application,
    );

    return {
      module: IdentityPresentationModule,
      imports: [applicationModule],
      exports: [applicationModule],
    };
  }
}
