import { ConfigurableModuleBuilder } from '@nestjs/common';
import type { FormsInfrastructurePersistenceModuleOptions } from '../config';

export const {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN: FORMS_PERSISTENCE_MODULE_OPTIONS,
  OPTIONS_TYPE,
  ASYNC_OPTIONS_TYPE,
} = new ConfigurableModuleBuilder<FormsInfrastructurePersistenceModuleOptions>()
  .setClassMethodName('forRoot')
  .setExtras<{ isGlobal?: boolean }>(
    { isGlobal: true },
    (definition, extras) => ({
      ...definition,
      global: extras.isGlobal ?? false,
    }),
  )
  .build();
