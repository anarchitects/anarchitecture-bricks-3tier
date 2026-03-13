import { ConfigurableModuleBuilder } from '@nestjs/common';
import type { ResolvedCommonMailerModuleOptions } from './config/mailer.config';

export const {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN: COMMON_MAILER_MODULE_OPTIONS,
  OPTIONS_TYPE,
  ASYNC_OPTIONS_TYPE,
} = new ConfigurableModuleBuilder<ResolvedCommonMailerModuleOptions>()
  .setClassMethodName('forProvider')
  .setExtras<{ isGlobal?: boolean }>(
    { isGlobal: true },
    (definition, extras) => ({
      ...definition,
      global: extras.isGlobal ?? false,
    }),
  )
  .build();
