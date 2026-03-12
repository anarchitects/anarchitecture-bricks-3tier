import { ConfigurableModuleBuilder } from '@nestjs/common';
import type { ResolvedAuthPersistenceModuleOptions } from '../config';

export const {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN: AUTH_PERSISTENCE_MODULE_OPTIONS,
  OPTIONS_TYPE,
  ASYNC_OPTIONS_TYPE,
} = new ConfigurableModuleBuilder<ResolvedAuthPersistenceModuleOptions>()
  .setClassMethodName('forRoot')
  .setExtras<{ isGlobal?: boolean }>(
    { isGlobal: true },
    (definition, extras) => ({
      ...definition,
      global: extras.isGlobal ?? false,
    }),
  )
  .build();
