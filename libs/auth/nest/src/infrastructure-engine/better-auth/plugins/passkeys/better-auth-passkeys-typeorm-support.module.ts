import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PasskeyEntity } from './passkey.entity';

@Module({
  imports: [TypeOrmModule.forFeature([PasskeyEntity])],
  exports: [TypeOrmModule],
})
export class BetterAuthPasskeysTypeormSupportModule {}
