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
            // Upcoming release candidates are checked by the packed host matrix;
            // checked-in versions remain CI-release-owned until #469.
            '@anarchitects/auth-ts',
            '@anarchitects/auth-declarations',
            '@anarchitects/common-nest-mailer',
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
