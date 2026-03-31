import { FormConfig } from '@anarchitects/forms-ts/models';
import { Component, ComponentRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ValidatorFn } from '@angular/forms';
import { AnarchitectsUiForm } from './form';

@Component({
  imports: [AnarchitectsUiForm],
  template: `
    <section
      class="anx-root"
      data-anx-theme="ocean"
      data-anx-density="comfortable"
      data-anx-surface="card"
      data-anx-layout="grid"
    >
      <anarchitects-forms-ui-form
        [config]="config"
        [layout]="'form:grid'"
        [layoutOptions]="{ columns: 2 }"
      ></anarchitects-forms-ui-form>
    </section>
  `,
})
class ThemedFormHostComponent {
  readonly config: FormConfig = {
    id: 'themed-form',
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
        required: true,
        ui: { label: 'Name' },
      },
    ],
  };
}

describe('Form', () => {
  let component: AnarchitectsUiForm;
  let fixture: ComponentFixture<AnarchitectsUiForm>;
  let ref: ComponentRef<AnarchitectsUiForm>;

  const mockFormConfig: FormConfig = {
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
      {
        name: 'password',
        kind: 'password',
        minLength: 6,
        required: true,
        ui: { label: 'Password' },
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
    expect(component.formGroup.contains('password')).toBe(true);
  });

  it('should render password fields with type password', () => {
    const nativeElement = fixture.nativeElement as HTMLElement;
    const passwordInput = nativeElement.querySelector(
      'input#password',
    ) as HTMLInputElement | null;
    expect(passwordInput).toBeTruthy();
    expect(passwordInput?.type).toBe('password');
  });

  it('should emit submitted event with correct payload on valid submit', () => {
    expect(component.formGroup.valid).toBe(false);
    const spy = vi.spyOn(component.submitted, 'emit');
    component.formGroup.setValue({
      email: 'test@example.com',
      name: 'Test User',
      password: 'secret123',
    });
    expect(component.formGroup.valid).toBe(true);
    component.onSubmit();
    expect(spy).toHaveBeenCalledWith({
      formId: 'test-form',
      formVersion: 1,
      payload: {
        email: 'test@example.com',
        name: 'Test User',
        password: 'secret123',
      },
    });
  });
  it('should not emit submitted event on invalid submit', () => {
    const spy = vi.spyOn(component.submitted, 'emit');
    component.formGroup.setValue({
      email: 'invalid-email',
      name: 'Tu',
      password: 'short',
    });
    expect(component.formGroup.valid).toBe(false);
    component.onSubmit();
    expect(spy).not.toHaveBeenCalled();
  });

  it('should keep the form invalid when matchFields validation fails', () => {
    const config: FormConfig = {
      id: 'register',
      version: 1,
      fields: [
        {
          name: 'password',
          kind: 'password',
          minLength: 6,
          required: true,
          ui: { label: 'Password' },
        },
        {
          name: 'confirmPassword',
          kind: 'password',
          minLength: 6,
          required: true,
          ui: { label: 'Confirm Password' },
        },
      ],
      validationRules: [
        {
          kind: 'matchFields',
          sourceField: 'password',
          targetField: 'confirmPassword',
          message: 'Passwords must match.',
        },
      ],
    };

    ref.setInput('config', config);
    fixture.detectChanges();

    component.formGroup.setValue({
      password: 'secret123',
      confirmPassword: 'secret124',
    });
    component.formGroup.get('confirmPassword')?.markAsTouched();
    fixture.detectChanges();

    expect(component.formGroup.invalid).toBe(true);
    expect(component.fieldErrorMessage('confirmPassword')).toBe(
      'Passwords must match.',
    );
  });

  it('should clear cross-field errors once fields match', () => {
    const config: FormConfig = {
      id: 'register',
      version: 1,
      fields: [
        { name: 'password', kind: 'password', minLength: 6, required: true },
        {
          name: 'confirmPassword',
          kind: 'password',
          minLength: 6,
          required: true,
        },
      ],
      validationRules: [
        {
          kind: 'matchFields',
          sourceField: 'password',
          targetField: 'confirmPassword',
          message: 'Passwords must match.',
        },
      ],
    };

    ref.setInput('config', config);
    fixture.detectChanges();

    component.formGroup.setValue({
      password: 'secret123',
      confirmPassword: 'secret124',
    });
    component.formGroup.get('confirmPassword')?.markAsTouched();
    fixture.detectChanges();

    component.formGroup.patchValue({ confirmPassword: 'secret123' });
    fixture.detectChanges();

    expect(component.formGroup.valid).toBe(true);
    expect(component.fieldErrorMessage('confirmPassword')).toBeNull();
  });

  it('should compose runtime validators with declarative validation rules', () => {
    const config: FormConfig = {
      id: 'register',
      version: 1,
      fields: [
        { name: 'email', kind: 'email', required: true },
        { name: 'password', kind: 'password', minLength: 6, required: true },
        {
          name: 'confirmPassword',
          kind: 'password',
          minLength: 6,
          required: true,
        },
      ],
      validationRules: [
        {
          kind: 'matchFields',
          sourceField: 'password',
          targetField: 'confirmPassword',
          message: 'Passwords must match.',
        },
      ],
    };
    const runtimeValidator: ValidatorFn = (control) =>
      control.get('email')?.value === 'blocked@example.com'
        ? { runtimeBlocked: true }
        : null;

    ref.setInput('config', config);
    ref.setInput('runtimeValidators', [runtimeValidator]);
    fixture.detectChanges();

    component.formGroup.setValue({
      email: 'blocked@example.com',
      password: 'secret123',
      confirmPassword: 'secret124',
    });
    fixture.detectChanges();

    expect(component.formGroup.hasError('runtimeBlocked')).toBe(true);
    expect(component.formGroup.errors?.['crossField']).toEqual({
      confirmPassword: {
        kind: 'matchFields',
        message: 'Passwords must match.',
      },
    });
  });
});

describe('Form theme and layout integration', () => {
  let fixture: ComponentFixture<ThemedFormHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ThemedFormHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(ThemedFormHostComponent);
    fixture.detectChanges();
  });

  it('should preserve themed root selectors and render non-default grid layout', () => {
    const nativeElement = fixture.nativeElement as HTMLElement;
    const root = nativeElement.querySelector('.anx-root') as HTMLElement;
    const grid = nativeElement.querySelector(
      '.anx-default-layout__form-grid',
    ) as HTMLElement;

    expect(root.getAttribute('data-anx-theme')).toBe('ocean');
    expect(root.getAttribute('data-anx-density')).toBe('comfortable');
    expect(root.getAttribute('data-anx-surface')).toBe('card');
    expect(root.getAttribute('data-anx-layout')).toBe('grid');

    expect(grid).toBeTruthy();
    expect(grid.style.getPropertyValue('--anx-layout-columns').trim()).toBe(
      '2',
    );
    expect(
      nativeElement.querySelectorAll('anarchitects-ui-field').length,
    ).toBeGreaterThanOrEqual(2);
  });
});
