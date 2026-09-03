import { FormsStore } from '@anarchitects/forms-angular/state';
import { AnarchitectsUiForm } from '@anarchitects/forms-angular/ui';
import type { FormsSchemaExtension } from '@anarchitects/forms-angular/ui';
import { FormConfig } from '@anarchitects/forms-ts/models';
import { ComponentRef, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { AnarchitectsFeatureForm } from './form';

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
    getFormDefinition: vi.fn(),
    submitForm: vi.fn(),
  };

  beforeEach(async () => {
    vi.clearAllMocks();
    mockFormsStore.submitted.set(false);
    mockFormsStore.selectedFormConfig.set({
      id: 'test-form',
      version: 1,
      fields: [],
    });

    await TestBed.configureTestingModule({
      imports: [AnarchitectsFeatureForm],
    })
      .overrideComponent(AnarchitectsFeatureForm, {
        set: {
          providers: [{ provide: FormsStore, useValue: mockFormsStore }],
        },
      })
      .compileComponents();

    fixture = TestBed.createComponent(AnarchitectsFeatureForm);
    component = fixture.componentInstance;
    ref = fixture.componentRef;
    ref.setInput('formId', 'test-form');
    ref.setInput('formVersion', 1);
    fixture.detectChanges();
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

  it('should forward pagePreset to forms ui form', () => {
    ref.setInput('pagePreset', {
      layoutVariant: 'card',
      actionAlignment: 'center',
    });
    fixture.detectChanges();

    const formUiDebug = fixture.debugElement.query(
      By.directive(AnarchitectsUiForm),
    );
    const formUi = formUiDebug.componentInstance as AnarchitectsUiForm;

    expect(formUi.pagePreset()).toEqual({
      layoutVariant: 'card',
      actionAlignment: 'center',
    });
  });

  it('should forward schema extensions to the forms ui form', () => {
    const extension = vi.fn() as unknown as FormsSchemaExtension;
    ref.setInput('schemaExtensions', [extension]);
    fixture.detectChanges();

    const formUi = fixture.debugElement.query(By.directive(AnarchitectsUiForm))
      .componentInstance as AnarchitectsUiForm;

    expect(formUi.schemaExtensions()).toEqual([extension]);
  });

  it('should forward page header inputs to forms ui form', () => {
    ref.setInput('pageTitle', 'Contact us');
    ref.setInput('pageSubtitle', 'Tell us what you need');
    ref.setInput('pageCaption', 'We usually respond within one business day.');
    fixture.detectChanges();

    const formUiDebug = fixture.debugElement.query(
      By.directive(AnarchitectsUiForm),
    );
    const formUi = formUiDebug.componentInstance as AnarchitectsUiForm;

    expect(formUi.pageTitle()).toBe('Contact us');
    expect(formUi.pageSubtitle()).toBe('Tell us what you need');
    expect(formUi.pageCaption()).toBe(
      'We usually respond within one business day.',
    );
  });

  it('should support the documented no-wrapper contact page configuration', () => {
    ref.setInput('pagePreset', {
      layoutVariant: 'stacked',
      maxInlineSize: '42rem',
      spacing: 'comfortable',
      actionAlignment: 'end',
    });
    ref.setInput('pageTitle', 'Contact us');
    ref.setInput(
      'pageCaption',
      'Get in touch and we will respond as soon as possible.',
    );
    fixture.detectChanges();

    const formUiDebug = fixture.debugElement.query(
      By.directive(AnarchitectsUiForm),
    );
    const formUi = formUiDebug.componentInstance as AnarchitectsUiForm;

    expect(formUi.pagePreset()).toEqual({
      layoutVariant: 'stacked',
      maxInlineSize: '42rem',
      spacing: 'comfortable',
      actionAlignment: 'end',
    });
    expect(formUi.pageTitle()).toBe('Contact us');
    expect(formUi.pageCaption()).toBe(
      'Get in touch and we will respond as soon as possible.',
    );
  });
});
