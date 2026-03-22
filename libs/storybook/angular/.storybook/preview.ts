import { provideHttpClient, withFetch } from '@angular/common/http';
import { applyAnxBaseStyles } from '@anarchitects/common-angular-design/styles';
import { setCompodocJson } from '@storybook/addon-docs/angular';
import { initialize, mswLoader } from 'msw-storybook-addon';
import {
  Preview,
  applicationConfig,
  componentWrapperDecorator,
} from '@storybook/angular';
import { compodocJson } from './compodoc';

const ANX_STORYBOOK_STYLES_ELEMENT_ID =
  'anx-storybook-angular-preview-styles';

const THEME_OPTIONS = ['default', 'ocean', 'ember', 'midnight'] as const;
const DENSITY_OPTIONS = ['comfortable', 'compact'] as const;
const SURFACE_OPTIONS = ['plain', 'card'] as const;
const LAYOUT_OPTIONS = ['list', 'grid'] as const;
const COLUMN_OPTIONS = ['1', '2', '3', '4'] as const;

const ANX_STORYBOOK_STYLES = `
.anx-storybook-frame {
  display: grid;
  align-content: start;
  gap: var(--anx-layout-gap-stack);
  inline-size: min(100%, 75rem);
  min-block-size: 100vh;
  margin-inline: auto;
  padding: clamp(1rem, 2vw, 1.5rem);
  transition:
    background-color 160ms ease,
    color 160ms ease,
    border-color 160ms ease,
    box-shadow 160ms ease;
}

.anx-storybook-frame[data-anx-surface='card'] {
  border-radius: var(--anx-sys-radius-lg);
  border: 1px solid var(--anx-sys-color-border);
}

.anx-root[data-anx-theme='ocean'] {
  --anx-ref-color-neutral-0: #f7fbff;
  --anx-ref-color-neutral-50: #eef6ff;
  --anx-ref-color-neutral-100: #d5e5f4;
  --anx-ref-color-neutral-700: #35516b;
  --anx-ref-color-neutral-900: #112336;
  --anx-ref-color-brand-500: #0076bd;
  --anx-ref-color-brand-700: #00578d;
  --anx-ref-color-success-500: #157f61;
  --anx-ref-color-success-50: #e8f7f1;
  --anx-ref-color-danger-500: #c24f5d;
  --anx-ref-color-danger-50: #fdeef1;
  --anx-ref-shadow-soft: 0 18px 42px rgba(17, 35, 54, 0.12);
}

.anx-root[data-anx-theme='ember'] {
  --anx-ref-color-neutral-0: #fffaf5;
  --anx-ref-color-neutral-50: #fef0e4;
  --anx-ref-color-neutral-100: #f3dcc7;
  --anx-ref-color-neutral-700: #6b4b39;
  --anx-ref-color-neutral-900: #26170f;
  --anx-ref-color-brand-500: #c45f1d;
  --anx-ref-color-brand-700: #8f4311;
  --anx-ref-color-success-500: #4f8a38;
  --anx-ref-color-success-50: #edf7e8;
  --anx-ref-color-danger-500: #bf3d31;
  --anx-ref-color-danger-50: #feece8;
  --anx-ref-shadow-soft: 0 18px 40px rgba(90, 43, 13, 0.14);
}

.anx-root[data-anx-theme='midnight'] {
  --anx-ref-color-neutral-0: #11161d;
  --anx-ref-color-neutral-50: #18212a;
  --anx-ref-color-neutral-100: #273241;
  --anx-ref-color-neutral-700: #c7d3e2;
  --anx-ref-color-neutral-900: #f4f7fb;
  --anx-ref-color-brand-500: #58b7ff;
  --anx-ref-color-brand-700: #86cbff;
  --anx-ref-color-success-500: #44c58c;
  --anx-ref-color-success-50: #18392d;
  --anx-ref-color-danger-500: #ff7a7a;
  --anx-ref-color-danger-50: #431f26;
  --anx-ref-shadow-soft: 0 24px 56px rgba(0, 0, 0, 0.35);
}
`;

function resolveGlobalValue(
  value: unknown,
  allowedValues: readonly string[],
  fallback: string,
): string {
  return typeof value === 'string' && allowedValues.includes(value)
    ? value
    : fallback;
}

function applyAnxStorybookStyles(documentRef?: Document): HTMLStyleElement | null {
  const doc =
    documentRef ?? (typeof document === 'undefined' ? undefined : document);

  if (!doc) {
    return null;
  }

  const existing = doc.getElementById(ANX_STORYBOOK_STYLES_ELEMENT_ID);
  if (existing instanceof HTMLStyleElement) {
    return existing;
  }

  const styleElement = doc.createElement('style');
  styleElement.id = ANX_STORYBOOK_STYLES_ELEMENT_ID;
  styleElement.textContent = ANX_STORYBOOK_STYLES;
  doc.head.appendChild(styleElement);
  return styleElement;
}

setCompodocJson(compodocJson);
initialize({ onUnhandledRequest: 'bypass' });
applyAnxBaseStyles();
applyAnxStorybookStyles();

const preview: Preview = {
  loaders: [mswLoader],
  decorators: [
    applicationConfig({
      providers: [provideHttpClient(withFetch())],
    }),
    componentWrapperDecorator(
      (story) => `
        <section
          class="anx-root anx-storybook-frame"
          [attr.data-anx-theme]="anxTheme"
          [attr.data-anx-density]="anxDensity"
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
          'default',
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
          { value: 'default', title: 'Default' },
          { value: 'ocean', title: 'Ocean' },
          { value: 'ember', title: 'Ember' },
          { value: 'midnight', title: 'Midnight' },
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
    anxTheme: 'default',
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
