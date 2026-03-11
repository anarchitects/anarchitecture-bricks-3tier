import { DynamicModule, Module } from '@nestjs/common';
import { CommonMailerNoopModule } from '@anarchitects/common-nest-mailer';
import { FormsApplicationModule } from './application';
import { FormsInfrastructureMailerModule } from './infrastructure-mailer';
import { FormsPresentationModule } from './presentation';

export type FormsModuleFeatures = {
  mailer?: boolean;
};

export type FormsModuleOptions = {
  features?: FormsModuleFeatures;
};

@Module({})
export class FormsModule {
  static forRoot(options: FormsModuleOptions = {}): DynamicModule {
    const mailerEnabled = options.features?.mailer ?? true;
    const mailerModule = mailerEnabled
      ? FormsInfrastructureMailerModule
      : CommonMailerNoopModule;

    return {
      module: FormsModule,
      imports: [FormsPresentationModule, FormsApplicationModule, mailerModule],
      exports: [FormsPresentationModule, FormsApplicationModule, mailerModule],
    };
  }
}
