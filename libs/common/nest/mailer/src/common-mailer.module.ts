import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/adapters/handlebars.adapter';
import { DynamicModule, Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { NodeMailerAdapter } from './adapters/node-mailer.adapter';
import { NoopMailerAdapter } from './adapters/noop-mailer.adapter';
import {
  ConfigurableModuleClass,
  OPTIONS_TYPE,
} from './common-mailer.module-definition';
import {
  CommonMailerModuleOptions,
  MailerConfig,
  mailerConfig,
  mapMailerConfigToModuleOptions,
  resolveCommonMailerModuleOptions,
} from './config/mailer.config';
import { MailerPort } from './ports/mailer.port';

export type CommonMailerModuleAsyncOptions = Parameters<
  typeof MailerModule.forRootAsync
>[0];

@Module({})
export class CommonMailerModule extends ConfigurableModuleClass {
  static forRoot(options: CommonMailerModuleOptions = {}): DynamicModule {
    const resolvedOptions: typeof OPTIONS_TYPE =
      resolveCommonMailerModuleOptions(options);
    const providers = [];
    const exports = [];

    switch (resolvedOptions.provider) {
      case 'node':
        providers.push(NodeMailerAdapter, {
          provide: MailerPort,
          useExisting: NodeMailerAdapter,
        });
        exports.push(MailerPort, NodeMailerAdapter);
        break;
      case 'noop':
        providers.push(NoopMailerAdapter, {
          provide: MailerPort,
          useExisting: NoopMailerAdapter,
        });
        exports.push(MailerPort, NoopMailerAdapter);
        break;
      default:
        throw new Error(
          `Unsupported mailer provider: ${resolvedOptions.provider}`,
        );
    }

    return {
      ...super.forProvider(resolvedOptions),
      providers,
      exports,
    };
  }

  static forProviderFromConfig(
    overrides: CommonMailerModuleOptions = {},
  ): DynamicModule {
    const configOptions = mapMailerConfigToModuleOptions(mailerConfig());
    const moduleDefinition = this.forRoot({
      ...configOptions,
      ...overrides,
    });

    return {
      ...moduleDefinition,
      imports: [
        ConfigModule.forFeature(mailerConfig),
        ...(moduleDefinition.imports ?? []),
      ],
    };
  }

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
          adapter: new HandlebarsAdapter(),
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
