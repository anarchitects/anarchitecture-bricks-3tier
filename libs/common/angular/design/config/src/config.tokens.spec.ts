import { TestBed } from '@angular/core/testing';
import {
  DESIGN_SYSTEM_CONFIG,
  DESIGN_SYSTEM_DEFAULTS,
  injectDesignSystemConfig,
} from './config.tokens';

describe('design-system tokens', () => {
  it('should expose fallback defaults via helper injection', () => {
    TestBed.runInInjectionContext(() => {
      expect(injectDesignSystemConfig()).toEqual(DESIGN_SYSTEM_DEFAULTS);
    });
  });

  it('should resolve explicit config when provided', () => {
    const customConfig = {
      theme: 'consumer-theme',
      density: 'compact' as const,
      surface: 'card' as const,
      layout: 'grid' as const,
      columns: 4,
    };

    TestBed.configureTestingModule({
      providers: [{ provide: DESIGN_SYSTEM_CONFIG, useValue: customConfig }],
    });

    TestBed.runInInjectionContext(() => {
      expect(injectDesignSystemConfig()).toEqual(customConfig);
    });
  });
});
