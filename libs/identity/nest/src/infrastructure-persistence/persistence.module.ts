import { DynamicModule, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserProfilesRepository } from '../application/ports/user-profiles.repository';
import { UserProfileEntity } from './entities/user-profile.entity';
import { TypeormUserProfilesRepository } from './repositories/typeorm-user-profiles.repository';

@Module({})
export class IdentityInfrastructurePersistenceModule {
  static forRoot(): DynamicModule {
    return {
      module: IdentityInfrastructurePersistenceModule,
      imports: [TypeOrmModule.forFeature([UserProfileEntity])],
      providers: [
        TypeormUserProfilesRepository,
        {
          provide: UserProfilesRepository,
          useExisting: TypeormUserProfilesRepository,
        },
      ],
      exports: [UserProfilesRepository, TypeOrmModule],
    };
  }
}
