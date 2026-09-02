import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
import type { StorybookConfig } from '@storybook/angular';

const config: StorybookConfig = {
  stories: ['../../../**/angular/**/*.stories.@(js|jsx|ts|tsx)'],
  addons: [getAbsolutePath('@storybook/addon-docs')],
  framework: {
    name: getAbsolutePath('@storybook/angular'),
    options: {},
  },
  staticDirs: ['../../../../public'],
  webpackFinal: async (webpackConfig) => {
    webpackConfig.module ??= { rules: [] };
    webpackConfig.module.rules ??= [];
    webpackConfig.module.rules.push({
      test: /\.css$/,
      include: [
        fileURLToPath(new URL('./preview.css', import.meta.url)),
        getAbsolutePath('@anarchitects/tailwind'),
      ],
      use: [
        getModulePath('style-loader'),
        getModulePath('css-loader'),
        {
          loader: getModulePath('postcss-loader'),
          options: {
            postcssOptions: {
              plugins: {
                '@tailwindcss/postcss': {},
              },
            },
          },
        },
      ],
    });
    return webpackConfig;
  },
};

export default config;

// To customize your webpack configuration you can use the webpackFinal field.
// Check https://storybook.js.org/docs/react/builders/webpack#extending-storybooks-webpack-config
// and https://nx.dev/recipes/storybook/custom-builder-configs

function getAbsolutePath(value: string): string {
  return dirname(fileURLToPath(import.meta.resolve(`${value}/package.json`)));
}

function getModulePath(value: string): string {
  return fileURLToPath(import.meta.resolve(value));
}
