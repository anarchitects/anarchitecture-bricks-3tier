import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtTokenInvalidationRepository } from './jwt-token-invalidation.repository';
import { InvalidatedTokenEntity } from './invalidated-token.entity';
import { TypeormJwtTokenInvalidationRepository } from './typeorm-jwt-token-invalidation.repository';

@Module({
  imports: [TypeOrmModule.forFeature([InvalidatedTokenEntity])],
  providers: [
    TypeormJwtTokenInvalidationRepository,
    {
      provide: JwtTokenInvalidationRepository,
      useExisting: TypeormJwtTokenInvalidationRepository,
    },
  ],
  exports: [JwtTokenInvalidationRepository],
})
export class BetterAuthJwtTypeormSupportModule {}
