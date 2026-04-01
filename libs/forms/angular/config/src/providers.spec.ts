import { TestBed } from '@angular/core/testing';
import { FORMS_PAGE_PRESET } from './page-preset';
import {
  provideFormsConfig,
  provideFormsDefaults,
  provideFormsPagePreset,
} from './providers';
import { API_RESOURCE_PATH, FORMS_CONFIG, FormsConfig } from './tokens';

describe('FormsConfig Providers', () => {
  it('should provide default config when using provideFormsDefaults', () => {
    TestBed.configureTestingModule({
      providers: [...provideFormsDefaults()],
    });
    const config: FormsConfig = TestBed.inject(FORMS_CONFIG);
    const apiResourcePath = TestBed.inject(API_RESOURCE_PATH);
    expect(config.apiResourcePath).toBe('forms');
    expect(apiResourcePath).toBe('forms');
  });
  it('should override config when using provideFormsConfig', () => {
    const customConfig: FormsConfig = {
      apiResourcePath: 'custom-path',
      apiBaseUrl: '/api',
    };
    TestBed.configureTestingModule({
      providers: [...provideFormsConfig(customConfig)],
    });
    const config: FormsConfig = TestBed.inject(FORMS_CONFIG);
    const apiResourcePath = TestBed.inject(API_RESOURCE_PATH);
    expect(config.apiResourcePath).toBe('custom-path');
    expect(apiResourcePath).toBe('custom-path');
  });

  it('should provide normalized page preset using provideFormsPagePreset', () => {
    TestBed.configureTestingModule({
      providers: [
        ...provideFormsPagePreset({
          layoutVariant: 'grid',
          columns: 0,
          actionAlignment: 'center',
          pageTitle: ' Contact us ',
        }),
      ],
    });

    const preset = TestBed.inject(FORMS_PAGE_PRESET);
    expect(preset.layoutVariant).toBe('grid');
    expect(preset.columns).toBe(1);
    expect(preset.actionAlignment).toBe('center');
    expect(preset.pageTitle).toBe('Contact us');
  });
});
