import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AuthApplicationModule } from './application';
import { authConfig } from './config';
import { AuthMailerModule } from './infrastructure-mailer';
import { AuthPersistenceModule } from './infrastructure-persistence';
import { AuthPresentationModule } from './presentation';

export type AuthModuleFeatures = {
  mailer?: boolean;
};

export type AuthModuleOptions = {
  application: Parameters<typeof AuthApplicationModule.forRoot>[0];
  persistence: Parameters<typeof AuthPersistenceModule.forRoot>[0];
  features?: AuthModuleFeatures;
};

@Module({})
export class AuthModule {
  static forRoot(options: AuthModuleOptions): DynamicModule {
    const mailerEnabled = options.features?.mailer ?? true;
    const applicationModule = AuthApplicationModule.forRoot(
      options.application,
    );
    const persistenceModule = AuthPersistenceModule.forRoot(
      options.persistence,
    );
    const imports = [
      ConfigModule.forFeature(authConfig),
      applicationModule,
      persistenceModule,
      AuthPresentationModule,
    ];
    const exports = [
      applicationModule,
      persistenceModule,
      AuthPresentationModule,
    ];

    if (mailerEnabled) {
      imports.push(AuthMailerModule);
      exports.push(AuthMailerModule);
    }

    return {
      module: AuthModule,
      imports,
      exports,
    };
  }
}
