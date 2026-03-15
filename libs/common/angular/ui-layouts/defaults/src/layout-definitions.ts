import {
  AnxLayoutDefinition,
  AnxLayoutId,
  createAnxLayoutId,
} from '@anarchitects/common-angular-ui-layouts/contracts';
import { AnxLayoutDefaults } from '@anarchitects/common-angular-ui-layouts/registry';
import { AnarchitectsUiDefaultDetailLayoutRenderer } from './detail-layout-renderer.component';
import { AnarchitectsUiDefaultFormLayoutRenderer } from './form-layout-renderer.component';
import { AnarchitectsUiDefaultListLayoutRenderer } from './list-layout-renderer.component';

export const ANX_DEFAULT_FORM_LAYOUT_IDS = {
  stacked: createAnxLayoutId('form', 'stacked'),
  grid: createAnxLayoutId('form', 'grid'),
  inline: createAnxLayoutId('form', 'inline'),
  card: createAnxLayoutId('form', 'card'),
} as const;

export const ANX_DEFAULT_LIST_LAYOUT_IDS = {
  list: createAnxLayoutId('list', 'list'),
  grid: createAnxLayoutId('list', 'grid'),
  card: createAnxLayoutId('list', 'card'),
  table: createAnxLayoutId('list', 'table'),
} as const;

export const ANX_DEFAULT_DETAIL_LAYOUT_IDS = {
  page: createAnxLayoutId('detail', 'page'),
  card: createAnxLayoutId('detail', 'card'),
  sidebar: createAnxLayoutId('detail', 'sidebar'),
} as const;

export const ANX_DEFAULT_LAYOUT_DEFINITIONS: readonly AnxLayoutDefinition[] = [
  createFormLayoutDefinition(
    ANX_DEFAULT_FORM_LAYOUT_IDS.stacked,
    'Stacked form layout',
  ),
  createFormLayoutDefinition(
    ANX_DEFAULT_FORM_LAYOUT_IDS.grid,
    'Grid form layout',
  ),
  createFormLayoutDefinition(
    ANX_DEFAULT_FORM_LAYOUT_IDS.inline,
    'Inline form layout',
  ),
  createFormLayoutDefinition(
    ANX_DEFAULT_FORM_LAYOUT_IDS.card,
    'Card form layout',
  ),

  createListLayoutDefinition(ANX_DEFAULT_LIST_LAYOUT_IDS.list, 'List layout'),
  createListLayoutDefinition(
    ANX_DEFAULT_LIST_LAYOUT_IDS.grid,
    'Grid list layout',
  ),
  createListLayoutDefinition(
    ANX_DEFAULT_LIST_LAYOUT_IDS.card,
    'Card list layout',
  ),
  createListLayoutDefinition(
    ANX_DEFAULT_LIST_LAYOUT_IDS.table,
    'Table list layout',
  ),

  createDetailLayoutDefinition(
    ANX_DEFAULT_DETAIL_LAYOUT_IDS.page,
    'Page detail layout',
  ),
  createDetailLayoutDefinition(
    ANX_DEFAULT_DETAIL_LAYOUT_IDS.card,
    'Card detail layout',
  ),
  createDetailLayoutDefinition(
    ANX_DEFAULT_DETAIL_LAYOUT_IDS.sidebar,
    'Sidebar detail layout',
  ),
];

export const ANX_DEFAULT_LAYOUT_DEFAULTS: AnxLayoutDefaults = {
  form: ANX_DEFAULT_FORM_LAYOUT_IDS.stacked,
  list: ANX_DEFAULT_LIST_LAYOUT_IDS.list,
  detail: ANX_DEFAULT_DETAIL_LAYOUT_IDS.page,
};

function createFormLayoutDefinition(
  id: AnxLayoutId,
  description: string,
): AnxLayoutDefinition {
  return {
    id,
    kind: 'form',
    renderer: AnarchitectsUiDefaultFormLayoutRenderer,
    supportedTemplates: [
      'field',
      'header',
      'toolbar',
      'actions',
      'footer',
      'empty',
    ],
    supportedSlots: [
      'header',
      'toolbar',
      'content',
      'actions',
      'footer',
      'empty',
    ],
    description,
  };
}

function createListLayoutDefinition(
  id: AnxLayoutId,
  description: string,
): AnxLayoutDefinition {
  return {
    id,
    kind: 'list',
    renderer: AnarchitectsUiDefaultListLayoutRenderer,
    supportedTemplates: [
      'item',
      'cell',
      'header',
      'toolbar',
      'actions',
      'footer',
      'empty',
      'app-row-detail',
    ],
    supportedSlots: ['header', 'toolbar', 'item', 'actions', 'footer', 'empty'],
    description,
  };
}

function createDetailLayoutDefinition(
  id: AnxLayoutId,
  description: string,
): AnxLayoutDefinition {
  return {
    id,
    kind: 'detail',
    renderer: AnarchitectsUiDefaultDetailLayoutRenderer,
    supportedTemplates: [
      'content',
      'header',
      'toolbar',
      'actions',
      'footer',
      'sidebar',
    ],
    supportedSlots: [
      'header',
      'toolbar',
      'content',
      'actions',
      'footer',
      'sidebar',
    ],
    description,
  };
}
