import { DynamicModule, Module } from '@nestjs/common';
import type { IdentityApplicationModuleOptions } from '../config';
import { IdentityInfrastructurePersistenceModule } from '../infrastructure-persistence';
import { CreateUserProfileService } from './services/create-user-profile.service';
import { GetUserProfileService } from './services/get-user-profile.service';
import { UpdateUserProfileService } from './services/update-user-profile.service';

@Module({})
export class IdentityApplicationModule {
  static forRoot(
    _options: IdentityApplicationModuleOptions = {},
  ): DynamicModule {
    void _options;

    return {
      module: IdentityApplicationModule,
      imports: [IdentityInfrastructurePersistenceModule.forRoot()],
      providers: [
        CreateUserProfileService,
        GetUserProfileService,
        UpdateUserProfileService,
      ],
      exports: [
        CreateUserProfileService,
        GetUserProfileService,
        UpdateUserProfileService,
      ],
    };
  }
}
