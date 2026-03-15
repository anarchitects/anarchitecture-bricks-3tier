import { Provider } from '@angular/core';
import { provideFormsState } from './forms-state.provider';
import { FormsStore } from './forms.store';

describe('provideFormsState', () => {
  it('should be a function', () => {
    expect(typeof provideFormsState).toBe('function');
  });

  it('should return FormsStore as Provider', () => {
    const provider = provideFormsState();
    expect(provider).toBe(FormsStore);
  });

  it('should be assignable to Provider type', () => {
    const provider: Provider = provideFormsState();
    expect(provider).toBeDefined();
  });
});
