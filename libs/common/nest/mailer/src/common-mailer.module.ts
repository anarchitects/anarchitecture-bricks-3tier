import { DynamicModule, Module } from '@nestjs/common';
import { MailerModule } from '@nestjs-modules/mailer';
import { ConfigModule } from '@nestjs/config';
import { MailerConfig, mailerConfig } from './config/mailer.config';

export type CommonMailerModuleAsyncOptions = Parameters<
  typeof MailerModule.forRootAsync
>[0];

@Module({})
export class CommonMailerModule {
  static forRootFromConfig(): DynamicModule {
    return CommonMailerModule.forRootAsync({
      imports: [ConfigModule.forFeature(mailerConfig)],
      inject: [mailerConfig.KEY],
      useFactory: (config: MailerConfig) => ({
        transport: {
          host: config.host,
          port: config.port,
          secure: config.secure,
          ignoreTLS: config.ignoreTLS,
          auth: {
            user: config.user,
            pass: config.pass,
          },
        },
        defaults: {
          from: config.default,
        },
        template: {
          dir: config.templateDir,
        },
      }),
    });
  }

  static forRootAsync(options: CommonMailerModuleAsyncOptions): DynamicModule {
    return {
      module: CommonMailerModule,
      imports: [MailerModule.forRootAsync(options)],
      exports: [MailerModule],
    };
  }
}
