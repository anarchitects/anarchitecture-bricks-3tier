import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ANX_DATA_ATTRIBUTES } from '@anarchitects/common-angular-design/contracts';
import {
  DESIGN_SYSTEM_COLUMNS,
  DESIGN_SYSTEM_CONFIG,
  DESIGN_SYSTEM_DENSITY,
  DESIGN_SYSTEM_LAYOUT,
  DESIGN_SYSTEM_SURFACE,
  DESIGN_SYSTEM_THEME,
} from './config.tokens';
import {
  provideDesignSystemConfig,
  provideDesignSystemDefaults,
} from './config.providers';

describe('design-system providers', () => {
  const managedAttributes = [
    ANX_DATA_ATTRIBUTES.theme,
    ANX_DATA_ATTRIBUTES.density,
    ANX_DATA_ATTRIBUTES.surface,
  ] as const;

  let originalClassName = '';
  let originalAttributes: Record<
    (typeof managedAttributes)[number],
    string | null
  >;

  beforeEach(() => {
    TestBed.resetTestingModule();

    originalClassName = document.documentElement.className;
    originalAttributes = {
      'data-anx-theme': document.documentElement.getAttribute(
        ANX_DATA_ATTRIBUTES.theme,
      ),
      'data-anx-density': document.documentElement.getAttribute(
        ANX_DATA_ATTRIBUTES.density,
      ),
      'data-anx-surface': document.documentElement.getAttribute(
        ANX_DATA_ATTRIBUTES.surface,
      ),
    };

    document.documentElement.className = '';
    for (const attributeName of managedAttributes) {
      document.documentElement.removeAttribute(attributeName);
    }
  });

  afterEach(() => {
    document.documentElement.className = originalClassName;
    for (const attributeName of managedAttributes) {
      const originalValue = originalAttributes[attributeName];
      if (originalValue == null) {
        document.documentElement.removeAttribute(attributeName);
        continue;
      }

      document.documentElement.setAttribute(attributeName, originalValue);
    }
  });

  it('should provide defaults and sync managed attributes when no overrides are passed', async () => {
    TestBed.configureTestingModule({
      providers: [...provideDesignSystemDefaults()],
    });

    await TestBed.inject(ApplicationInitStatus).donePromise;

    expect(TestBed.inject(DESIGN_SYSTEM_THEME)).toBe('default');
    expect(TestBed.inject(DESIGN_SYSTEM_DENSITY)).toBe('comfortable');
    expect(TestBed.inject(DESIGN_SYSTEM_SURFACE)).toBe('plain');
    expect(TestBed.inject(DESIGN_SYSTEM_LAYOUT)).toBe('list');
    expect(TestBed.inject(DESIGN_SYSTEM_COLUMNS)).toBe(1);
    expect(document.documentElement.classList.contains('anx-root')).toBe(true);
    expect(document.documentElement.getAttribute('data-anx-theme')).toBe(
      'default',
    );
    expect(document.documentElement.getAttribute('data-anx-density')).toBe(
      'comfortable',
    );
    expect(document.documentElement.getAttribute('data-anx-surface')).toBe(
      'plain',
    );
    expect(document.documentElement.hasAttribute('data-anx-layout')).toBe(
      false,
    );
    expect(document.documentElement.hasAttribute('data-anx-columns')).toBe(
      false,
    );
  });

  it('should preserve explicit document attributes over provider sync', async () => {
    document.documentElement.setAttribute('data-anx-theme', 'manual-theme');

    TestBed.configureTestingModule({
      providers: [
        ...provideDesignSystemConfig({
          theme: 'enterprise',
          density: 'compact',
          surface: 'card',
          layout: 'grid',
          columns: 3,
        }),
      ],
    });

    await TestBed.inject(ApplicationInitStatus).donePromise;

    expect(TestBed.inject(DESIGN_SYSTEM_THEME)).toBe('enterprise');
    expect(TestBed.inject(DESIGN_SYSTEM_DENSITY)).toBe('compact');
    expect(TestBed.inject(DESIGN_SYSTEM_SURFACE)).toBe('card');
    expect(TestBed.inject(DESIGN_SYSTEM_LAYOUT)).toBe('grid');
    expect(TestBed.inject(DESIGN_SYSTEM_COLUMNS)).toBe(3);

    const mergedConfig = TestBed.inject(DESIGN_SYSTEM_CONFIG);
    expect(mergedConfig.theme).toBe('enterprise');
    expect(document.documentElement.getAttribute('data-anx-theme')).toBe(
      'manual-theme',
    );
    expect(document.documentElement.getAttribute('data-anx-density')).toBe(
      'compact',
    );
    expect(document.documentElement.getAttribute('data-anx-surface')).toBe(
      'card',
    );
  });
});
