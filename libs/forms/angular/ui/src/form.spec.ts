import { FormConfig } from '@anarchitects/forms-ts/models';
import {
  ChangeDetectionStrategy,
  Component,
  ComponentRef,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { SchemaPath, validate } from '@angular/forms/signals';
import {
  AnarchitectsFormsSlotDirective,
  AnarchitectsUiForm,
  FormsSchemaExtension,
} from './index';

@Component({
  imports: [AnarchitectsUiForm, AnarchitectsFormsSlotDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <anarchitects-forms-ui-form [config]="config">
      <p anxSlot="app-forms-caption-top">Top caption A</p>
      <p anxSlot="app-forms-caption-top">Top caption B</p>
      <div anxSlot="app-forms-page-header">
        <h1>Projected header title</h1>
      </div>
      <p anxSlot="app-forms-caption-bottom">Bottom caption</p>
    </anarchitects-forms-ui-form>
  `,
})
class HeaderCompositionHostComponent {
  readonly config: FormConfig = {
    id: 'header-form',
    version: 1,
    fields: [{ name: 'email', kind: 'email', required: true }],
  };
}

describe('AnarchitectsUiForm Signal Forms', () => {
  let component: AnarchitectsUiForm;
  let fixture: ComponentFixture<AnarchitectsUiForm>;
  let ref: ComponentRef<AnarchitectsUiForm>;

  const config: FormConfig = {
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
        maxLength: 10,
        required: true,
        ui: { label: 'Name' },
      },
      {
        name: 'consent',
        kind: 'boolean',
        ui: { label: 'Consent', placeholder: 'I agree' },
      },
    ],
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnarchitectsUiForm],
    }).compileComponents();

    fixture = TestBed.createComponent(AnarchitectsUiForm);
    component = fixture.componentInstance;
    ref = fixture.componentRef;
    ref.setInput('config', config);
    fixture.detectChanges();
  });

  function requireSignalForm() {
    const currentForm = component.signalForm();
    if (!currentForm) {
      throw new Error('Expected the Signal Form to be initialized.');
    }
    return currentForm;
  }

  function requireFieldTree(fieldName: string) {
    const field = component.fieldTree(fieldName);
    if (!field) {
      throw new Error(`Expected Signal Form field "${fieldName}".`);
    }
    return field;
  }

  it('creates a non-null signal model with type-safe defaults', () => {
    expect(component.formModel()).toEqual({
      email: '',
      name: '',
      consent: false,
    });
    expect(component.signalForm()).toBeTruthy();
  });

  it('applies required, email, minimum, and maximum length validation', () => {
    const form = requireSignalForm();
    expect(form().invalid()).toBe(true);

    component.formModel.set({
      email: 'invalid-email',
      name: 'ab',
      consent: false,
    });
    expect(requireFieldTree('email')().getError('email')).toBeTruthy();
    expect(requireFieldTree('name')().getError('minLength')).toBeTruthy();

    component.formModel.set({
      email: 'person@example.com',
      name: 'a-name-that-is-too-long',
      consent: false,
    });
    expect(requireFieldTree('name')().getError('maxLength')).toBeTruthy();

    component.formModel.set({
      email: 'person@example.com',
      name: 'Jane',
      consent: false,
    });
    expect(form().valid()).toBe(true);
  });

  it('exposes touched, dirty, and field error state', () => {
    const email = requireFieldTree('email');
    email().markAsTouched();
    email().markAsDirty();
    fixture.detectChanges();

    expect(email().touched()).toBe(true);
    expect(email().dirty()).toBe(true);
    expect(component.isFieldInvalid('email')).toBe(true);
    expect(component.fieldErrorMessage('email')).toBe(
      'This field is required.',
    );
  });

  it('applies declarative cross-field validation to the target field', () => {
    ref.setInput('config', {
      id: 'register',
      version: 1,
      fields: [
        { name: 'password', kind: 'password', required: true, minLength: 6 },
        {
          name: 'confirmPassword',
          kind: 'password',
          required: true,
          minLength: 6,
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
    } satisfies FormConfig);
    fixture.detectChanges();

    component.formModel.set({
      password: 'secret123',
      confirmPassword: 'secret124',
    });
    const confirmPassword = requireFieldTree('confirmPassword');
    confirmPassword().markAsTouched();
    expect(confirmPassword().invalid()).toBe(true);
    expect(component.fieldErrorMessage('confirmPassword')).toBe(
      'Passwords must match.',
    );

    component.formModel.update((model) => ({
      ...model,
      confirmPassword: 'secret123',
    }));
    expect(requireSignalForm()().valid()).toBe(true);
  });

  it('composes host schema extensions with contract validation', () => {
    const blockedEmail: FormsSchemaExtension = (path) => {
      validate(path['email'] as SchemaPath<string>, ({ value }) =>
        value() === 'blocked@example.com'
          ? { kind: 'blocked', message: 'This email is blocked.' }
          : undefined,
      );
    };
    ref.setInput('schemaExtensions', [blockedEmail]);
    fixture.detectChanges();

    component.formModel.set({
      email: 'blocked@example.com',
      name: 'Jane',
      consent: false,
    });
    const email = requireFieldTree('email');
    email().markAsTouched();

    expect(email().getError('blocked')).toBeTruthy();
    expect(component.fieldErrorMessage('email')).toBe('This email is blocked.');
  });

  it('submits a non-null payload and resets values and interaction state', async () => {
    const emitSpy = vi.spyOn(component.submitted, 'emit');
    component.formModel.set({
      email: 'person@example.com',
      name: 'Jane',
      consent: true,
    });
    requireFieldTree('email')().markAsTouched();
    requireFieldTree('name')().markAsDirty();

    expect(await component.onSubmit()).toBe(true);
    expect(emitSpy).toHaveBeenCalledWith({
      formId: 'test-form',
      formVersion: 1,
      payload: {
        email: 'person@example.com',
        name: 'Jane',
        consent: true,
      },
    });
    expect(component.formModel()).toEqual({
      email: '',
      name: '',
      consent: false,
    });
    expect(requireSignalForm()().touched()).toBe(false);
    expect(requireSignalForm()().dirty()).toBe(false);
  });

  it('marks invalid fields touched and does not submit invalid data', async () => {
    const emitSpy = vi.spyOn(component.submitted, 'emit');

    expect(await component.onSubmit()).toBe(false);
    expect(requireSignalForm()().touched()).toBe(true);
    expect(emitSpy).not.toHaveBeenCalled();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain(
      'This field is required.',
    );
  });

  it('renders native semantic controls and the domain-owned layout', () => {
    ref.setInput('pagePreset', {
      layoutVariant: 'grid',
      spacing: 'compact',
      actionAlignment: 'center',
      columns: 3,
      maxInlineSize: '56rem',
    });
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.getAttribute('data-anx-layout')).toBe('grid');
    expect(
      host.style.getPropertyValue('--anx-forms-layout-columns').trim(),
    ).toBe('3');
    expect(
      host.style.getPropertyValue('--anx-forms-actions-justify').trim(),
    ).toBe('center');
    expect(host.querySelectorAll('.anx-forms-ui-form__field')).toHaveLength(3);
    expect(host.querySelector('input#email[type="email"]')).toBeTruthy();
    expect(host.querySelector('input[type="checkbox"]')).toBeTruthy();

    const submitButton = host.querySelector<HTMLButtonElement>(
      'button[type="submit"]',
    );
    expect(submitButton?.disabled).toBe(true);

    component.formModel.set({
      email: 'person@example.com',
      name: 'Jane',
      consent: false,
    });
    fixture.detectChanges();
    expect(submitButton?.disabled).toBe(false);
  });

  it('renders semantic header inputs', () => {
    ref.setInput('pageTitle', 'Contact us');
    ref.setInput('pageSubtitle', 'Tell us what you need');
    ref.setInput('pageCaption', 'We respond within one business day.');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.querySelector('h1')?.textContent).toContain('Contact us');
    expect(host.querySelector('h2')?.textContent).toContain(
      'Tell us what you need',
    );
    expect(host.textContent).toContain('We respond within one business day.');
  });
});

describe('form projection ownership', () => {
  it('renders forms-owned named slots without the common composition package', async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderCompositionHostComponent],
    }).compileComponents();
    const fixture = TestBed.createComponent(HeaderCompositionHostComponent);
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(
      host.querySelectorAll("[data-anx-slot='app-forms-caption-top']"),
    ).toHaveLength(2);
    expect(host.textContent).toContain('Projected header title');
    expect(host.textContent).toContain('Bottom caption');
  });
});
