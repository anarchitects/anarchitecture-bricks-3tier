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
              onlyDependOnLibsWithTags: [
                'domain:shared',
                'domain:forms',
                'auth:declaration',
              ],
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
              sourceTag: 'domain:identity',
              onlyDependOnLibsWithTags: [
                'domain:shared',
                'domain:auth',
                'domain:identity',
              ],
            },
            {
              sourceTag: 'auth:contracts',
              onlyDependOnLibsWithTags: ['domain:shared', 'auth:contracts'],
            },
            {
              sourceTag: 'auth:declaration',
              onlyDependOnLibsWithTags: [
                'domain:shared',
                'auth:contracts',
                'auth:declaration',
              ],
            },
            {
              sourceTag: 'auth:runtime',
              onlyDependOnLibsWithTags: [
                'domain:shared',
                'domain:forms',
                'auth:contracts',
                'auth:declaration',
                'auth:runtime',
              ],
            },
            {
              sourceTag: 'auth:client',
              notDependOnLibsWithTags: ['auth:runtime', 'auth:declaration'],
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

  // 🔒 ADR enforcement: common must remain domain-neutral
  {
    files: ['libs/common/**/*.{ts,tsx,js,jsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@anarchitects/forms-*', '@anarchitects/auth-*'],
              message:
                'Common libraries must remain domain-neutral and may not depend on forms or auth domains.',
            },
          ],
        },
      ],
    },
  },

  // 🔒 ADR enforcement: forms must not depend on auth
  {
    files: ['libs/forms/**/*.{ts,tsx,js,jsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@anarchitects/auth-*'],
              message:
                'Forms is a generic intake domain and must not depend on auth domain.',
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
            {
              name: '@anarchitects/auth-nest',
              allowImportNames: ['AuthorizedResource'],
              message:
                'Nest controllers may declare security with @anarchitects/auth-declarations. Runtime auth-nest composition belongs in app-shell modules; only AuthorizedResource is allowed here as the request-bound resource reader.',
            },
            {
              name: '@anarchitects/auth-nest/presentation',
              message:
                'Do not import auth-nest presentation runtime APIs into controllers. Use @anarchitects/auth-declarations for controller-facing security metadata.',
            },
            {
              name: '@anarchitects/auth-nest/application',
              message:
                'Do not import auth-nest application runtime APIs into controllers for security wiring.',
            },
            {
              name: '@anarchitects/auth-nest/config',
              message:
                'Do not import auth-nest config/runtime shell APIs into controllers.',
            },
            {
              name: '@anarchitects/auth-nest/infrastructure-persistence',
              message:
                'Do not import auth-nest infrastructure runtime APIs into controllers.',
            },
            {
              name: '@anarchitects/auth-nest/infrastructure-mailer',
              message:
                'Do not import auth-nest infrastructure runtime APIs into controllers.',
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
  {
    files: ['libs/*/angular/feature/**/*.ts'],
    ignores: ['**/*.spec.ts', '**/*.test.ts', '**/*.stories.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          paths: [
            {
              name: '@anarchitects/auth-nest',
              message:
                'Feature bricks must not import the Nest runtime package. Security runtime activation belongs to app composition, not feature code.',
            },
            {
              name: '@anarchitects/auth-nest/presentation',
              message:
                'Feature bricks must not import auth-nest presentation runtime APIs.',
            },
            {
              name: '@anarchitects/auth-nest/application',
              message:
                'Feature bricks must not import auth-nest application runtime APIs.',
            },
            {
              name: '@anarchitects/auth-nest/config',
              message:
                'Feature bricks must not import auth-nest config/runtime shell APIs.',
            },
            {
              name: '@anarchitects/auth-nest/infrastructure-persistence',
              message:
                'Feature bricks must not import auth-nest infrastructure runtime APIs.',
            },
            {
              name: '@anarchitects/auth-nest/infrastructure-mailer',
              message:
                'Feature bricks must not import auth-nest infrastructure runtime APIs.',
            },
          ],
        },
      ],
    },
  },
  // Nx project tags cannot see layer boundaries inside a single publishable
  // package with many secondary entrypoints, so auth relies on path-based
  // ESLint restrictions to enforce those internal layer contracts.
  {
    files: ['libs/auth/angular/feature/**/*.ts'],
    ignores: ['**/*.spec.ts', '**/*.test.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@anarchitects/auth-angular/data-access',
                '@anarchitects/auth-angular/data-access/*',
                '../data-access',
                '../data-access/*',
                '../../data-access',
                '../../data-access/*',
                '../../../data-access',
                '../../../data-access/*',
                '../../../../data-access',
                '../../../../data-access/*',
                '../*/src',
                '../*/src/*',
                '../../*/src',
                '../../*/src/*',
                '../../../*/src',
                '../../../*/src/*',
                '../../../../*/src',
                '../../../../*/src/*',
              ],
              message:
                "Auth Angular feature code must depend on state/ui/config/util entrypoints, never data-access or another entrypoint's internal src path.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ['libs/auth/angular/state/**/*.ts'],
    ignores: ['**/*.spec.ts', '**/*.test.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@anarchitects/auth-angular/feature',
                '@anarchitects/auth-angular/feature/*',
                '@anarchitects/auth-angular/ui',
                '@anarchitects/auth-angular/ui/*',
                '../feature',
                '../feature/*',
                '../../feature',
                '../../feature/*',
                '../../../feature',
                '../../../feature/*',
                '../ui',
                '../ui/*',
                '../../ui',
                '../../ui/*',
                '../../../ui',
                '../../../ui/*',
                '../*/src',
                '../*/src/*',
                '../../*/src',
                '../../*/src/*',
                '../../../*/src',
                '../../../*/src/*',
                '../../../../*/src',
                '../../../../*/src/*',
              ],
              message:
                "Auth Angular state may depend on data-access/config/util, but not on feature/ui or another entrypoint's internal src path.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ['libs/auth/angular/ui/**/*.ts'],
    ignores: ['**/*.spec.ts', '**/*.test.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@anarchitects/auth-angular/feature',
                '@anarchitects/auth-angular/feature/*',
                '@anarchitects/auth-angular/state',
                '@anarchitects/auth-angular/state/*',
                '@anarchitects/auth-angular/data-access',
                '@anarchitects/auth-angular/data-access/*',
                '../feature',
                '../feature/*',
                '../../feature',
                '../../feature/*',
                '../../../feature',
                '../../../feature/*',
                '../state',
                '../state/*',
                '../../state',
                '../../state/*',
                '../../../state',
                '../../../state/*',
                '../data-access',
                '../data-access/*',
                '../../data-access',
                '../../data-access/*',
                '../../../data-access',
                '../../../data-access/*',
                '../*/src',
                '../*/src/*',
                '../../*/src',
                '../../*/src/*',
                '../../../*/src',
                '../../../*/src/*',
                '../../../../*/src',
                '../../../../*/src/*',
              ],
              message:
                "Auth Angular UI must stay presentation-only and may not import feature/state/data-access layers or another entrypoint's internal src path.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ['libs/auth/angular/data-access/**/*.ts'],
    ignores: ['**/*.spec.ts', '**/*.test.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '@anarchitects/auth-angular/feature',
                '@anarchitects/auth-angular/feature/*',
                '@anarchitects/auth-angular/state',
                '@anarchitects/auth-angular/state/*',
                '@anarchitects/auth-angular/ui',
                '@anarchitects/auth-angular/ui/*',
                '../feature',
                '../feature/*',
                '../../feature',
                '../../feature/*',
                '../../../feature',
                '../../../feature/*',
                '../state',
                '../state/*',
                '../../state',
                '../../state/*',
                '../../../state',
                '../../../state/*',
                '../ui',
                '../ui/*',
                '../../ui',
                '../../ui/*',
                '../../../ui',
                '../../../ui/*',
                '../*/src',
                '../*/src/*',
                '../../*/src',
                '../../*/src/*',
                '../../../*/src',
                '../../../*/src/*',
                '../../../../*/src',
                '../../../../*/src/*',
              ],
              message:
                "Auth Angular data-access may only depend on config/util and shared TS contracts, never feature/state/ui or another entrypoint's internal src path.",
            },
          ],
        },
      ],
    },
  },
  {
    files: ['libs/auth/nest/src/presentation/**/*.ts'],
    ignores: [
      '**/*.module.ts',
      '**/*.module-definition.ts',
      '**/index.ts',
      '**/*.spec.ts',
      '**/*.test.ts',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '../infrastructure-*',
                '../infrastructure-*/*',
                '../../infrastructure-*',
                '../../infrastructure-*/*',
                '../../../infrastructure-*',
                '../../../infrastructure-*/*',
              ],
              message:
                'Auth Nest presentation may depend on application/config/util, but not on infrastructure modules directly.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['libs/auth/nest/src/application/**/*.ts'],
    ignores: [
      '**/*.module.ts',
      '**/*.module-definition.ts',
      '**/index.ts',
      '**/*.spec.ts',
      '**/*.test.ts',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '../presentation',
                '../presentation/*',
                '../../presentation',
                '../../presentation/*',
                '../../../presentation',
                '../../../presentation/*',
                '../infrastructure-*',
                '../infrastructure-*/*',
                '../../infrastructure-*',
                '../../infrastructure-*/*',
                '../../../infrastructure-*',
                '../../../infrastructure-*/*',
              ],
              message:
                'Auth Nest application code may depend on config/util and application-owned ports, but not on presentation or infrastructure.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['libs/auth/nest/src/infrastructure-*/**/*.ts'],
    ignores: [
      '**/*.module.ts',
      '**/*.module-definition.ts',
      '**/index.ts',
      '**/*.spec.ts',
      '**/*.test.ts',
    ],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '../presentation',
                '../presentation/*',
                '../../presentation',
                '../../presentation/*',
                '../../../presentation',
                '../../../presentation/*',
                '../../../../presentation',
                '../../../../presentation/*',
              ],
              message:
                'Auth Nest infrastructure may implement application ports, but it must not depend on presentation.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['libs/auth/nest/src/config/**/*.ts'],
    ignores: ['**/*.spec.ts', '**/*.test.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                '../application',
                '../application/*',
                '../../application',
                '../../application/*',
                '../presentation',
                '../presentation/*',
                '../../presentation',
                '../../presentation/*',
                '../infrastructure-*',
                '../infrastructure-*/*',
                '../../infrastructure-*',
                '../../infrastructure-*/*',
              ],
              message:
                'Auth Nest config must stay neutral and may not depend on application, presentation, or infrastructure.',
            },
          ],
        },
      ],
    },
  },
];
