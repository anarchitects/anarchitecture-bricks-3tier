import baseConfig from '../../../../eslint.config.mjs';

export default [
  ...baseConfig,
  {
    files: ['**/*.json'],
    rules: {
      '@nx/dependency-checks': [
        'error',
        {
          // Required through upstream mailer runtime imports and public declarations.
          ignoredDependencies: [
            '@types/nodemailer',
            'handlebars',
            'nodemailer',
          ],
          ignoredFiles: [
            '{projectRoot}/eslint.config.{js,cjs,mjs,ts,cts,mts}',
            // This standalone test consumer owns its Nest bootstrap dependencies.
            '{projectRoot}/tests/fixtures/**/*.cjs',
            '{projectRoot}/tests/nest-consumer.*',
          ],
        },
      ],
    },
    languageOptions: {
      parser: await import('jsonc-eslint-parser'),
    },
  },
];
