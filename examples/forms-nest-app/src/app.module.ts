import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { FormsPresentationModule } from '@anarchitects/forms-nest/presentation';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: 'localhost',
      port: 5432,
      username: 'anarchitects',
      password: 'anarchitects',
      database: 'anarchitects',
      autoLoadEntities: true,
      synchronize: true,
    }),
    FormsPresentationModule,
  ],
  controllers: [],
  providers: [],
})
export class AppModule {}
