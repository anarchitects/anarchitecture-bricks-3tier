/// <reference types='vitest' />
import { defineConfig } from 'vite';
import dts from 'vite-plugin-dts';
import * as path from 'path';
import { nxViteTsPaths } from '@nx/vite/plugins/nx-tsconfig-paths.plugin';
import { nxCopyAssetsPlugin } from '@nx/vite/plugins/nx-copy-assets.plugin';

export default defineConfig(() => ({
  root: import.meta.dirname,
  cacheDir: '../../../node_modules/.vite/libs/newsletter/ts',
  plugins: [
    nxViteTsPaths(),
    nxCopyAssetsPlugin(['*.md']),
    dts({
      entryRoot: 'src',
      tsconfigPath: path.join(import.meta.dirname, 'tsconfig.lib.json'),
      pathsToAliases: false,
    }),
  ],
  build: {
    outDir: '../../../dist/libs/newsletter/ts',
    emptyOutDir: true,
    reportCompressedSize: true,
    commonjsOptions: { transformMixedEsModules: true },
    lib: {
      entry: {
        index: 'src/index.ts',
        'dtos/index': 'src/dtos/index.ts',
        'models/index': 'src/models/index.ts',
      },
      formats: ['es' as const, 'cjs' as const],
    },
    rolldownOptions: { external: ['@sinclair/typebox'] },
  },
  test: {
    name: 'newsletter-ts',
    watch: false,
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    coverage: {
      reportsDirectory: '../../../coverage/libs/newsletter/ts',
      provider: 'v8' as const,
    },
  },
}));
