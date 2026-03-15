import { TestBed } from '@angular/core/testing';
import {
  AnxLayoutDefinition,
  createAnxLayoutId,
} from '@anarchitects/common-angular-ui-layouts/contracts';
import {
  AnxLayoutRegistryService,
  provideAnxLayoutDefaults,
  provideAnxLayouts,
} from './index';

class FormStackedRenderer {}
class FormGridRenderer {}
class ListRenderer {}

const TEST_LAYOUTS: readonly AnxLayoutDefinition[] = [
  {
    id: createAnxLayoutId('form', 'stacked'),
    kind: 'form',
    renderer: FormStackedRenderer,
    supportedTemplates: ['field'],
    supportedSlots: ['header', 'actions', 'footer'],
    description: 'Form stacked layout',
  },
  {
    id: createAnxLayoutId('form', 'grid'),
    kind: 'form',
    renderer: FormGridRenderer,
    supportedTemplates: ['field'],
    supportedSlots: ['header', 'actions', 'footer'],
    description: 'Form grid layout',
  },
  {
    id: createAnxLayoutId('list', 'list'),
    kind: 'list',
    renderer: ListRenderer,
    supportedTemplates: ['item'],
    supportedSlots: ['header', 'toolbar', 'empty'],
    description: 'List layout',
  },
];

describe('AnxLayoutRegistryService', () => {
  function setup(providers: unknown[] = []): AnxLayoutRegistryService {
    TestBed.configureTestingModule({
      providers: [AnxLayoutRegistryService, ...providers],
    });

    return TestBed.inject(AnxLayoutRegistryService);
  }

  it('should register and list layouts by kind', () => {
    const registry = setup([provideAnxLayouts(TEST_LAYOUTS)]);

    expect(registry.listLayouts()).toHaveLength(3);
    expect(registry.listLayouts('form')).toHaveLength(2);
    expect(registry.listLayouts('list')).toHaveLength(1);
  });

  it('should resolve with precedence explicit > default > fallback', () => {
    const registry = setup([
      provideAnxLayouts(TEST_LAYOUTS),
      provideAnxLayoutDefaults({ form: 'form:grid' }),
    ]);

    const explicit = registry.resolveLayout('form', 'form:stacked');
    const defaults = registry.resolveLayout('form');
    const fallback = registry.resolveLayout('list');

    expect(explicit.definition.id).toBe('form:stacked');
    expect(explicit.source).toBe('explicit');

    expect(defaults.definition.id).toBe('form:grid');
    expect(defaults.source).toBe('default');

    expect(fallback.definition.id).toBe('list:list');
    expect(fallback.source).toBe('fallback');
  });

  it('should fail-fast when duplicate layout ids are registered', () => {
    expect(() =>
      setup([
        provideAnxLayouts(TEST_LAYOUTS),
        provideAnxLayouts([
          {
            ...TEST_LAYOUTS[0],
            renderer: ListRenderer,
          },
        ]),
      ]),
    ).toThrow(/Duplicate layout definition id/);
  });
});
