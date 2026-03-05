import { TestBed } from '@angular/core/testing';
import { FormsStore } from '@anarchitects/forms-angular/state';
import { App } from './app';

describe('App', () => {
  const mockStore = {
    getFormDefinition: jest.fn(),
    submitForm: jest.fn(),
    loading: () => false,
    error: () => null,
    selectedFormConfig: () => null,
    submitted: () => false,
  };

  beforeEach(async () => {
    mockStore.getFormDefinition.mockClear();

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [{ provide: FormsStore, useValue: mockStore }],
    }).compileComponents();
  });

  it('requests the default form on startup', () => {
    TestBed.createComponent(App);

    expect(mockStore.getFormDefinition).toHaveBeenCalledWith({
      id: 'contact_default',
      version: 1,
    });
  });

  it('renders the example heading', () => {
    const fixture = TestBed.createComponent(App);
    fixture.detectChanges();

    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('h1')?.textContent).toContain(
      'Forms Angular Example',
    );
  });
});
