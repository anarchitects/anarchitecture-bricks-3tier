import { TestBed } from '@angular/core/testing';
import { provideFormsConfig, provideFormsDefaults } from './providers';
import { API_RESOURCE_PATH, FormsConfig, FORMS_CONFIG } from './tokens';

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
    const customConfig: FormsConfig = { apiResourcePath: 'custom-path' };
    TestBed.configureTestingModule({
      providers: [...provideFormsConfig(customConfig)],
    });
    const config: FormsConfig = TestBed.inject(FORMS_CONFIG);
    const apiResourcePath = TestBed.inject(API_RESOURCE_PATH);
    expect(config.apiResourcePath).toBe('custom-path');
    expect(apiResourcePath).toBe('custom-path');
  });
});
