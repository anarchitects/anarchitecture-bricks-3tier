import { TestBed } from '@angular/core/testing';
import { injectApiResourcePath, injectFormsConfig } from './tokens';

describe('FormsConfig', () => {
  it('should provide default values', () => {
    TestBed.runInInjectionContext(() => {
      const config = injectFormsConfig();
      expect(config.apiResourcePath).toBe('forms');
    });
  });
  it('should provide default API resource path', () => {
    TestBed.runInInjectionContext(() => {
      const apiResourcePath = injectApiResourcePath();
      expect(apiResourcePath).toBe('forms');
    });
  });
});
