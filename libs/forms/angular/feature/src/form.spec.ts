import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnarchitectsFeatureForm } from './form';
import { ComponentRef, signal } from '@angular/core';
import { FormConfig } from '@anarchitects/forms-ts/models';
import { FormsStore } from '@anarchitects/forms-angular/state';

describe('AnarchitectsFeatureForm', () => {
  let component: AnarchitectsFeatureForm;
  let fixture: ComponentFixture<AnarchitectsFeatureForm>;
  let ref: ComponentRef<AnarchitectsFeatureForm>;

  const mockFormsStore = {
    submitted: signal(false),
    selectedFormConfig: signal<FormConfig>({
      id: 'test-form',
      version: 1,
      fields: [],
    }),
    getFormDefinition: jest.fn(),
    submitForm: jest.fn(),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnarchitectsFeatureForm],
      providers: [{ provide: FormsStore, useValue: mockFormsStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(AnarchitectsFeatureForm);
    component = fixture.componentInstance;
    ref = fixture.componentRef;
    ref.setInput('formId', 'test-form');
    ref.setInput('formVersion', 1);
    fixture.autoDetectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should call getFormDefinition on init', () => {
    expect(mockFormsStore.getFormDefinition).toHaveBeenCalledWith({
      id: 'test-form',
      version: 1,
    });
  });
  it('should update formConfig when store changes', () => {
    expect(component.formConfig().id).toBe('test-form');
    mockFormsStore.selectedFormConfig.set({
      id: 'updated-form',
      version: 2,
      fields: [],
    });
    fixture.detectChanges();
    expect(component.formConfig().id).toBe('updated-form');
  });
  it('should call submitForm on submitForm', async () => {
    const submissionDto = {
      formId: 'test-form',
      formVersion: 1,
      payload: { field1: 'value1' },
    };
    await component.submitForm(submissionDto);
    expect(mockFormsStore.submitForm).toHaveBeenCalledWith(submissionDto);
  });
});
