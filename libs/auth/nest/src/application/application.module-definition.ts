import { ConfigurableModuleBuilder } from '@nestjs/common';

export const {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN: AUTH_APPLICATION_MODULE_OPTIONS,
  OPTIONS_TYPE,
  ASYNC_OPTIONS_TYPE,
} = new ConfigurableModuleBuilder<{
  authStrategies: string[];
  encryption: { algorithm: 'bcrypt' | 'argon2'; key: string };
}>()
  .setClassMethodName('forRoot')
  .setExtras<{ isGlobal?: boolean }>(
    { isGlobal: true },
    (definition, extras) => ({
      ...definition,
      global: extras.isGlobal ?? false,
    })
  )
  .build();
