import { ApplicationInitStatus } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { ANX_DATA_ATTRIBUTES } from '@anarchitects/common-angular-design/contracts';
import { provideDesignSystemConfig } from './config.providers';
import { provideDocumentDesignSystemDomSync } from './document-dom-sync.providers';

describe('document design-system DOM sync providers', () => {
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

  it('should mark the document root and fill missing managed attributes from config', async () => {
    await TestBed.configureTestingModule({
      providers: [
        ...provideDesignSystemConfig({
          theme: 'provider-theme',
          density: 'compact',
          surface: 'card',
          layout: 'grid',
          columns: 4,
        }),
        ...provideDocumentDesignSystemDomSync(),
      ],
    }).compileComponents();

    await TestBed.inject(ApplicationInitStatus).donePromise;

    expect(document.documentElement.classList.contains('anx-root')).toBe(true);
    expect(document.documentElement.getAttribute('data-anx-theme')).toBe(
      'provider-theme',
    );
    expect(document.documentElement.getAttribute('data-anx-density')).toBe(
      'compact',
    );
    expect(document.documentElement.getAttribute('data-anx-surface')).toBe(
      'card',
    );
    expect(document.documentElement.hasAttribute('data-anx-layout')).toBe(
      false,
    );
    expect(document.documentElement.hasAttribute('data-anx-columns')).toBe(
      false,
    );
  });

  it('should preserve explicit document attributes over provider values', async () => {
    document.documentElement.setAttribute('data-anx-theme', 'manual-theme');

    await TestBed.configureTestingModule({
      providers: [
        ...provideDesignSystemConfig({
          theme: 'provider-theme',
          density: 'comfortable',
          surface: 'plain',
          layout: 'list',
          columns: 1,
        }),
        ...provideDocumentDesignSystemDomSync(),
      ],
    }).compileComponents();

    await TestBed.inject(ApplicationInitStatus).donePromise;

    expect(document.documentElement.getAttribute('data-anx-theme')).toBe(
      'manual-theme',
    );
    expect(document.documentElement.getAttribute('data-anx-density')).toBe(
      'comfortable',
    );
    expect(document.documentElement.getAttribute('data-anx-surface')).toBe(
      'plain',
    );
  });
});
