import baseConfig from '../../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['**/*.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          ignoredFiles: [
            '{projectRoot}/eslint.config.{js,cjs,mjs,ts,cts,mts}',
            '{projectRoot}/tsconfig.integration.json',
            '{projectRoot}/src/integration/**/*',
          ],
          // Runtime peers required by Better Auth's passkey plugin are declared
          // here so package-manager peer resolution also works for consumers.
          ignoredDependencies: [
            '@better-auth/core',
            '@better-auth/utils',
            '@better-fetch/fetch',
            '@opentelemetry/api',
            'better-call',
            'jose',
            'kysely',
            'nanostores',
          ],
        },
      ],
    },
    languageOptions: {
      parser: await import('jsonc-eslint-parser'),
    },
  },
];
