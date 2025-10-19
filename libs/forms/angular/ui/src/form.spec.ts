import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnarchitectsUiForm } from './form';
import { ComponentRef } from '@angular/core';

describe('Form', () => {
  let component: AnarchitectsUiForm;
  let fixture: ComponentFixture<AnarchitectsUiForm>;
  let ref: ComponentRef<AnarchitectsUiForm>;

  const mockFormConfig = {
    id: 'test-form',
    version: 1,
    fields: [
      {
        name: 'email',
        kind: 'email',
        required: true,
        ui: { label: 'Email' },
      },
      {
        name: 'name',
        kind: 'string',
        minLength: 3,
        maxLength: 50,
        required: true,
        ui: { label: 'Name' },
      },
    ],
    security: { honeypot: 'extraField' },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnarchitectsUiForm],
    }).compileComponents();

    fixture = TestBed.createComponent(AnarchitectsUiForm);
    component = fixture.componentInstance;
    ref = fixture.componentRef;
    ref.setInput('config', mockFormConfig);
    fixture.autoDetectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should build form controls based on config', () => {
    expect(component.formGroup.contains('email')).toBe(true);
    expect(component.formGroup.contains('name')).toBe(true);
  });
  it('should emit submitted event with correct payload on valid submit', () => {
    expect(component.formGroup.valid).toBe(false);
    const spy = jest.spyOn(component.submitted, 'emit');
    component.formGroup.setValue({
      email: 'test@example.com',
      name: 'Test User',
    });
    expect(component.formGroup.valid).toBe(true);
    component.onSubmit();
    expect(spy).toHaveBeenCalledWith({
      formId: 'test-form',
      formVersion: 1,
      payload: {
        email: 'test@example.com',
        name: 'Test User',
      },
    });
  });
  it('should not emit submitted event on invalid submit', () => {
    const spy = jest.spyOn(component.submitted, 'emit');
    component.formGroup.setValue({
      email: 'invalid-email',
      name: 'Tu',
    });
    expect(component.formGroup.valid).toBe(false);
    component.onSubmit();
    expect(spy).not.toHaveBeenCalled();
  });
});
