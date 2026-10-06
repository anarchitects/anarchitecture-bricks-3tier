import baseConfig from '../../../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['**/*.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          // Required by the upstream mailer declarations exported from this package.
          ignoredDependencies: ['@types/nodemailer'],
          ignoredFiles: [
            '{projectRoot}/eslint.config.{js,cjs,mjs,ts,cts,mts}',
            // This standalone test consumer owns its Nest bootstrap dependencies.
            '{projectRoot}/tests/fixtures/**/*.cjs',
          ],
        },
      ],
    },
    languageOptions: {
      parser: await import('jsonc-eslint-parser'),
    },
  },
];
