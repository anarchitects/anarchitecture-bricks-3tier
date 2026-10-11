import baseConfig from '../../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['**/*.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          // Packed hosts verify upcoming minor contracts; CI owns source versions.
          ignoredDependencies: [
            '@anarchitects/newsletter-ts',
            '@anarchitects/common-nest-mailer',
          ],
          ignoredFiles: [
            '{projectRoot}/eslint.config.{js,cjs,mjs,ts,cts,mts}',
            // Isolated package-consumer checks use the workspace compiler only.
            '{projectRoot}/tests/**/*',
          ],
        },
      ],
    },
    languageOptions: {
      parser: await import('jsonc-eslint-parser'),
    },
  },
];
