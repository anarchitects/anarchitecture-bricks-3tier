import { TestBed } from '@angular/core/testing';
import { AnxLayoutRegistryService } from '@anarchitects/common-angular-ui-layouts/registry';
import { provideAnxDefaultLayouts } from './default-layout.providers';

describe('default-layout.providers', () => {
  it('should register default layouts and defaults in one helper', () => {
    TestBed.configureTestingModule({
      providers: [AnxLayoutRegistryService, ...provideAnxDefaultLayouts()],
    });

    const registry = TestBed.inject(AnxLayoutRegistryService);

    expect(registry.resolveLayout('form').definition.id).toBe('form:stacked');
    expect(registry.resolveLayout('list').definition.id).toBe('list:list');
    expect(registry.resolveLayout('detail').definition.id).toBe('detail:page');
  });
});
