import { ConfigurableModuleBuilder } from '@nestjs/common';
import type { ResolvedAuthApplicationModuleOptions } from '../config';

export const {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN: AUTH_APPLICATION_MODULE_OPTIONS,
  OPTIONS_TYPE,
  ASYNC_OPTIONS_TYPE,
} = new ConfigurableModuleBuilder<ResolvedAuthApplicationModuleOptions>()
  .setClassMethodName('forRoot')
  .setExtras<{ isGlobal?: boolean }>(
    { isGlobal: true },
    (definition, extras) => ({
      ...definition,
      global: extras.isGlobal ?? false,
    }),
  )
  .build();
