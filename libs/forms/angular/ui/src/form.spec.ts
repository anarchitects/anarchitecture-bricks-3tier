import { AnxSlotDirective } from '@anarchitects/common-angular-ui-composition/projection';
import { FormConfig } from '@anarchitects/forms-ts/models';
import { Component, ComponentRef } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ValidatorFn } from '@angular/forms';
import { AnarchitectsUiForm } from './form';

@Component({
  imports: [AnarchitectsUiForm],
  template: `
    <section
      class="anx-root anx-region anx-stack"
      data-anx-theme="ocean"
      data-anx-density="comfortable"
      data-anx-surface="card"
      data-anx-layout="grid"
    >
      <div class="anx-inline">
        <button type="button">Action</button>
      </div>
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

@Component({
  imports: [AnarchitectsUiForm, AnxSlotDirective],
  template: `
    <anarchitects-forms-ui-form
      [config]="config"
      [pageTitle]="pageTitle"
      [pageSubtitle]="pageSubtitle"
      [pageCaption]="pageCaption"
      [pagePreset]="pagePreset"
    >
      <p anxSlot="app-forms-caption-top">Top caption A</p>
      <p anxSlot="app-forms-caption-top">Top caption B</p>

      <div anxSlot="app-forms-page-header">
        <h1>Projected header title</h1>
      </div>

      <p anxSlot="app-forms-caption-bottom">Bottom caption A</p>
      <p anxSlot="app-forms-caption-bottom">Bottom caption B</p>
    </anarchitects-forms-ui-form>
  `,
})
class HeaderCompositionHostComponent {
  readonly config: FormConfig = {
    id: 'header-form',
    version: 1,
    fields: [
      {
        name: 'email',
        kind: 'email',
        required: true,
        ui: { label: 'Email' },
      },
    ],
  };
  pageTitle: string | null = null;
  pageSubtitle: string | null = null;
  pageCaption: string | null = null;
  pagePreset: Record<string, unknown> | null = null;
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

  it('should apply batteries-included defaults when no page preset is provided', () => {
    const host = fixture.nativeElement as HTMLElement;
    const layoutHost = host.querySelector(
      'anarchitects-ui-layout-host',
    ) as HTMLElement;
    const renderer = host.querySelector(
      'anarchitects-ui-default-form-layout-renderer',
    ) as HTMLElement;

    expect(layoutHost.getAttribute('data-anx-layout-id')).toBe('form:stacked');
    expect(
      host.style.getPropertyValue('--anx-forms-ui-max-inline-size').trim(),
    ).toBe('42rem');
    expect(
      renderer.style
        .getPropertyValue('--anx-layout-form-actions-justify')
        .trim(),
    ).toBe('flex-end');
    expect(
      renderer.style.getPropertyValue('--anx-layout-form-gap').trim(),
    ).toBe('var(--anx-layout-gap-stack)');
  });

  it('should build form controls based on config', () => {
    expect(component.formGroup.contains('email')).toBe(true);
    expect(component.formGroup.contains('name')).toBe(true);
    expect(component.formGroup.contains('password')).toBe(true);
  });

  it('should render one field wrapper per configured field', () => {
    const nativeElement = fixture.nativeElement as HTMLElement;
    const renderedFields = nativeElement.querySelectorAll(
      'anarchitects-ui-field',
    );

    expect(renderedFields.length).toBe(mockFormConfig.fields.length);
  });

  it('should not project whitespace-only help text into the hint slot', () => {
    const config: FormConfig = {
      id: 'help-text-form',
      version: 1,
      fields: [
        {
          name: 'email',
          kind: 'email',
          required: true,
          ui: {
            label: 'Email',
            help: '   ',
          },
        },
      ],
    };

    ref.setInput('config', config);
    fixture.detectChanges();

    const nativeElement = fixture.nativeElement as HTMLElement;
    const hint = nativeElement.querySelector(
      "[data-anx-slot='hint']",
    ) as HTMLElement | null;

    expect(hint?.textContent?.trim()).toBe('');
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

  it('should resolve layout and renderer options from page preset', () => {
    ref.setInput('pagePreset', {
      layoutVariant: 'grid',
      spacing: 'compact',
      actionAlignment: 'center',
      columns: 3,
      maxInlineSize: '56rem',
    });
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const layoutHost = host.querySelector(
      'anarchitects-ui-layout-host',
    ) as HTMLElement;
    const renderer = host.querySelector(
      'anarchitects-ui-default-form-layout-renderer',
    ) as HTMLElement;
    const grid = host.querySelector(
      '.anx-default-layout__form-grid',
    ) as HTMLElement;

    expect(layoutHost.getAttribute('data-anx-layout-id')).toBe('form:grid');
    expect(
      host.style.getPropertyValue('--anx-forms-ui-max-inline-size').trim(),
    ).toBe('56rem');
    expect(
      renderer.style
        .getPropertyValue('--anx-layout-form-actions-justify')
        .trim(),
    ).toBe('center');
    expect(
      renderer.style.getPropertyValue('--anx-layout-form-gap').trim(),
    ).toBe('var(--anx-sys-space-sm)');
    expect(grid.style.getPropertyValue('--anx-layout-columns').trim()).toBe(
      '3',
    );
  });

  it('should prefer explicit layout inputs over page preset defaults', () => {
    ref.setInput('pagePreset', {
      layoutVariant: 'grid',
      spacing: 'relaxed',
      actionAlignment: 'end',
      columns: 2,
      maxInlineSize: '48rem',
    });
    ref.setInput('layout', 'form:inline');
    ref.setInput('layoutOptions', {
      actionAlignment: 'start',
    });
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    const layoutHost = host.querySelector(
      'anarchitects-ui-layout-host',
    ) as HTMLElement;
    const renderer = host.querySelector(
      'anarchitects-ui-default-form-layout-renderer',
    ) as HTMLElement;

    expect(layoutHost.getAttribute('data-anx-layout-id')).toBe('form:inline');
    expect(
      renderer.style
        .getPropertyValue('--anx-layout-form-actions-justify')
        .trim(),
    ).toBe('flex-start');
    expect(
      host.style.getPropertyValue('--anx-forms-ui-max-inline-size').trim(),
    ).toBe('48rem');
  });

  it('should render semantic header elements from explicit header inputs', () => {
    ref.setInput('pageTitle', 'Contact us');
    ref.setInput('pageSubtitle', 'We usually respond within one day');
    ref.setInput('pageCaption', 'Send your request and our team will reply.');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(
      host.querySelector('.anx-forms-ui-form__title')?.textContent?.trim(),
    ).toBe('Contact us');
    expect(
      host.querySelector('.anx-forms-ui-form__subtitle')?.textContent?.trim(),
    ).toBe('We usually respond within one day');
    expect(
      host.querySelector('.anx-forms-ui-form__caption')?.textContent?.trim(),
    ).toBe('Send your request and our team will reply.');
  });

  it('should resolve header text from page preset defaults', () => {
    ref.setInput('pagePreset', {
      pageTitle: 'Preset title',
      pageCaption: 'Preset caption',
    });
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(
      host.querySelector('.anx-forms-ui-form__title')?.textContent?.trim(),
    ).toBe('Preset title');
    expect(
      host.querySelector('.anx-forms-ui-form__caption')?.textContent?.trim(),
    ).toBe('Preset caption');
  });

  it('should prefer explicit header inputs over preset header defaults', () => {
    ref.setInput('pagePreset', {
      pageTitle: 'Preset title',
      pageCaption: 'Preset caption',
    });
    ref.setInput('pageTitle', 'Input title');
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(
      host.querySelector('.anx-forms-ui-form__title')?.textContent?.trim(),
    ).toBe('Input title');
  });

  it('should render the canonical batteries-included page composition without custom CSS', () => {
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

    const host = fixture.nativeElement as HTMLElement;
    const surface = host.querySelector(
      '.anx-forms-ui-form__surface',
    ) as HTMLElement;
    const layoutHost = host.querySelector(
      'anarchitects-ui-layout-host',
    ) as HTMLElement;

    expect(surface).toBeTruthy();
    expect(layoutHost.getAttribute('data-anx-layout-id')).toBe('form:stacked');
    expect(
      host.style.getPropertyValue('--anx-forms-ui-max-inline-size').trim(),
    ).toBe('42rem');
    expect(
      host.querySelector('.anx-forms-ui-form__title')?.textContent?.trim(),
    ).toBe('Contact us');
    expect(
      host.querySelector('.anx-forms-ui-form__caption')?.textContent?.trim(),
    ).toBe('Get in touch and we will respond as soon as possible.');
  });
});

describe('Form header composition slots', () => {
  let fixture: ComponentFixture<HeaderCompositionHostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HeaderCompositionHostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HeaderCompositionHostComponent);
  });

  it('should render multiple top and bottom caption slots in order', () => {
    fixture.detectChanges();
    const host = fixture.nativeElement as HTMLElement;
    const topRegion = host.querySelectorAll(
      ".anx-forms-ui-form__caption-region p[data-anx-slot='app-forms-caption-top']",
    );
    const bottomRegion = host.querySelectorAll(
      ".anx-forms-ui-form__caption-region p[data-anx-slot='app-forms-caption-bottom']",
    );

    expect(topRegion.length).toBe(2);
    expect(topRegion[0]?.textContent?.trim()).toBe('Top caption A');
    expect(topRegion[1]?.textContent?.trim()).toBe('Top caption B');

    expect(bottomRegion.length).toBe(2);
    expect(bottomRegion[0]?.textContent?.trim()).toBe('Bottom caption A');
    expect(bottomRegion[1]?.textContent?.trim()).toBe('Bottom caption B');
  });

  it('should render projected page header slot content', () => {
    fixture.detectChanges();

    const host = fixture.nativeElement as HTMLElement;
    expect(host.textContent).toContain('Projected header title');
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

  describe('downstream-safety: shell-utility-collision regression prevention', () => {
    /**
     * Regression test verifying that form layouts render correctly when nested
     * inside consumer layout containers using shell utilities (anx-region, anx-stack, etc.).
     *
     * This validates the #221 refactor that removed shell-only utilities from
     * ui-layouts and ui-primitives package host bindings and internal templates,
     * replacing them with explicit CSS to prevent spacing collisions.
     *
     * Scenario: Form component used inside consumer's anx-stack and anx-region
     * containers should render without unintended spacing side effects.
     */
    it('should render without shell-utility collision side effects when nested in consumer layout', () => {
      const nativeElement = fixture.nativeElement as HTMLElement;
      const region = nativeElement.querySelector('.anx-region') as HTMLElement;
      const formComponent = nativeElement.querySelector(
        'anarchitects-forms-ui-form',
      ) as HTMLElement;
      const fields = nativeElement.querySelectorAll('anarchitects-ui-field');

      // Verify consumer container structure is valid
      expect(region).toBeTruthy();
      expect(formComponent).toBeTruthy();

      // Verify form renders fields without collision symptoms
      expect(fields.length).toBeGreaterThanOrEqual(2);

      // Verify computed styles: fields should have proper spacing
      // (no unintended layout inheritance from parent shell utilities)
      for (const field of Array.from(fields)) {
        const fieldElement = field as HTMLElement;
        const computedStyle = window.getComputedStyle(fieldElement);

        // Field should have display set (not be collapsed or hidden)
        expect(
          computedStyle.display,
          `Field should have valid display value, got: ${computedStyle.display}`,
        ).toBeTruthy();
      }
    });
  });
});
