import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: [
      '**/dist',
      '**/vite.config.*.timestamp*',
      '**/vitest.config.*.timestamp*',
    ],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: true,
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            {
              sourceTag: 'domain:shared',
              onlyDependOnLibsWithTags: ['domain:shared'],
            },
            {
              sourceTag: 'domain:forms',
              onlyDependOnLibsWithTags: ['domain:shared', 'domain:forms'],
            },
            {
              sourceTag: 'domain:auth',
              onlyDependOnLibsWithTags: [
                'domain:shared',
                'domain:forms',
                'domain:auth',
              ],
            },
            {
              sourceTag: 'domain:storybook',
              onlyDependOnLibsWithTags: ['*'],
            },
            {
              sourceTag: 'scope:docs',
              onlyDependOnLibsWithTags: ['*'],
            },
            {
              sourceTag: 'scope:release',
              onlyDependOnLibsWithTags: ['*'],
            },
            {
              sourceTag: 'scope:ts-frontend',
              onlyDependOnLibsWithTags: ['*'],
            },
          ],
        },
      ],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    // Override or add rules here
    rules: {},
  },
  {
    files: [
      'libs/*/nest/src/presentation/controllers/**/*.ts',
      'examples/**/*.controller.ts',
    ],
    ignores: ['**/*.spec.ts', '**/*.test.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@sinclair/typebox',
              message:
                'Do not define route schemas in Nest controllers. Import DTO schemas from libs/*/ts/dtos.',
            },
          ],
        },
      ],
      'no-restricted-syntax': [
        'error',
        {
          selector:
            "VariableDeclarator[id.type='Identifier'][id.name=/Schema$/][init.type='CallExpression'][init.callee.type='MemberExpression'][init.callee.object.type='Identifier'][init.callee.object.name='Type']",
          message:
            'Inline TypeBox schemas are not allowed in controllers. Move schema definitions to libs/*/ts DTOs and import them.',
        },
        {
          selector:
            "CallExpression[callee.name='RouteSchema'] > ObjectExpression > Property[key.type='Identifier'][key.name='operationId']",
          message:
            'operationId is OpenAPI metadata and must be assigned in tools/api-specs, not in controllers.',
        },
        {
          selector:
            "CallExpression[callee.name='RouteSchema'] > ObjectExpression > Property[key.type='Identifier'][key.name='tags']",
          message:
            'tags are OpenAPI metadata and must be assigned in tools/api-specs, not in controllers.',
        },
      ],
    },
  },
];
