import { provideHttpClient, withFetch } from '@angular/common/http';
import { setCompodocJson } from '@storybook/addon-docs/angular';
import { initialize, mswLoader } from 'msw-storybook-addon';
import {
  Preview,
  applicationConfig,
  componentWrapperDecorator,
} from '@storybook/angular';
import { compodocJson } from './compodoc';
import './preview.css';

const THEME_OPTIONS = ['light', 'dark'] as const;
const DENSITY_OPTIONS = ['comfortable', 'compact'] as const;
const SURFACE_OPTIONS = ['plain', 'card'] as const;
const LAYOUT_OPTIONS = ['list', 'grid'] as const;
const COLUMN_OPTIONS = ['1', '2', '3', '4'] as const;

function resolveGlobalValue(
  value: unknown,
  allowedValues: readonly string[],
  fallback: string,
): string {
  return typeof value === 'string' && allowedValues.includes(value)
    ? value
    : fallback;
}

setCompodocJson(compodocJson);
initialize({ onUnhandledRequest: 'bypass' });

const preview: Preview = {
  loaders: [mswLoader],
  decorators: [
    applicationConfig({
      providers: [provideHttpClient(withFetch())],
    }),
    componentWrapperDecorator(
      (story) => `
        <section
          class="anx-storybook-frame anx-stack bg-anx-canvas text-anx-foreground"
          [attr.data-theme]="anxTheme"
          [attr.data-density]="anxDensity"
          [attr.data-anx-surface]="anxSurface"
          [attr.data-anx-layout]="anxLayout"
          [attr.data-anx-columns]="anxColumns"
        >
          ${story}
        </section>
      `,
      ({ globals }) => ({
        anxTheme: resolveGlobalValue(
          globals['anxTheme'],
          THEME_OPTIONS,
          'light',
        ),
        anxDensity: resolveGlobalValue(
          globals['anxDensity'],
          DENSITY_OPTIONS,
          'comfortable',
        ),
        anxSurface: resolveGlobalValue(
          globals['anxSurface'],
          SURFACE_OPTIONS,
          'plain',
        ),
        anxLayout: resolveGlobalValue(
          globals['anxLayout'],
          LAYOUT_OPTIONS,
          'list',
        ),
        anxColumns: resolveGlobalValue(
          globals['anxColumns'],
          COLUMN_OPTIONS,
          '1',
        ),
      }),
    ),
  ],
  globalTypes: {
    anxTheme: {
      name: 'Theme',
      description: 'Preview token theme',
      toolbar: {
        icon: 'paintbrush',
        dynamicTitle: true,
        items: [
          { value: 'light', title: 'Light' },
          { value: 'dark', title: 'Dark' },
        ],
      },
    },
    anxDensity: {
      name: 'Density',
      description: 'Preview density',
      toolbar: {
        icon: 'mirror',
        dynamicTitle: true,
        items: [
          { value: 'comfortable', title: 'Comfortable' },
          { value: 'compact', title: 'Compact' },
        ],
      },
    },
    anxSurface: {
      name: 'Surface',
      description: 'Preview surface mode',
      toolbar: {
        icon: 'component',
        dynamicTitle: true,
        items: [
          { value: 'plain', title: 'Plain' },
          { value: 'card', title: 'Card' },
        ],
      },
    },
    anxLayout: {
      name: 'Layout',
      description: 'Preview layout mode',
      toolbar: {
        icon: 'sidebar',
        dynamicTitle: true,
        items: [
          { value: 'list', title: 'List' },
          { value: 'grid', title: 'Grid' },
        ],
      },
    },
    anxColumns: {
      name: 'Columns',
      description: 'Preview column count',
      toolbar: {
        icon: 'grid',
        dynamicTitle: true,
        items: [
          { value: '1', title: '1' },
          { value: '2', title: '2' },
          { value: '3', title: '3' },
          { value: '4', title: '4' },
        ],
      },
    },
  },
  initialGlobals: {
    anxTheme: 'light',
    anxDensity: 'comfortable',
    anxSurface: 'plain',
    anxLayout: 'list',
    anxColumns: '1',
  },
  parameters: {
    layout: 'fullscreen',
  },
};
export default preview;
