import { AnxTemplateDirective } from '@anarchitects/common-angular-ui-composition/templates';
import { AnxLayoutId } from '@anarchitects/common-angular-ui-layouts/contracts';
import { AnarchitectsUiLayoutHost } from '@anarchitects/common-angular-ui-layouts/host';
import {
  ANX_LAYOUT_DEFAULTS,
  ANX_LAYOUT_DEFINITIONS,
} from '@anarchitects/common-angular-ui-layouts/registry';
import { AnarchitectsUiInputDirective } from '@anarchitects/common-angular-ui-primitives/form-controls';
import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideAnxDefaultLayouts } from './default-layout.providers';

@Component({
  imports: [
    AnarchitectsUiLayoutHost,
    AnxTemplateDirective,
    AnarchitectsUiInputDirective,
  ],
  providers: [...provideAnxDefaultLayouts()],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      class="anx-root"
      data-anx-theme="ocean"
      data-anx-density="comfortable"
      data-anx-surface="card"
      data-anx-layout="grid"
    >
      <anarchitects-ui-layout-host
        [kind]="kind()"
        [layout]="layout()"
        [model]="model()"
        [layoutOptions]="layoutOptions()"
      >
        <ng-template anxTemplate="field" let-field>
          <input
            anarchitectsUiInput
            [id]="field.id || field.key"
            [placeholder]="field.label"
          />
        </ng-template>

        <ng-template anxTemplate="item" let-item>{{
          item.name ?? item
        }}</ng-template>
        <ng-template anxTemplate="cell" let-item>
          <strong>{{ item.name ?? item }}</strong>
        </ng-template>

        <ng-template anxTemplate="content" let-detail>
          <article class="detail-content">
            {{ detail.title ?? 'Detail' }}
          </article>
        </ng-template>

        <ng-template anxTemplate="sidebar" let-detail>
          <div class="detail-sidebar">
            Sidebar: {{ detail.title ?? 'Detail' }}
          </div>
        </ng-template>
      </anarchitects-ui-layout-host>
    </section>
  `,
})
class HostComponent {
  readonly kind = signal<'form' | 'list' | 'detail'>('form');
  readonly layout = signal<AnxLayoutId | null>('form:card');
  readonly layoutOptions = signal<Readonly<Record<string, unknown>>>({});
  readonly model = signal<unknown>({
    title: 'Form',
    fields: [
      { key: 'firstName', label: 'First Name', required: true },
      { key: 'lastName', label: 'Last Name' },
    ],
  });
}

describe('default layouts integration', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
  });

  it('should render form:card using card primitives', () => {
    fixture.detectChanges();

    const root = fixture.nativeElement.querySelector(
      '.anx-root',
    ) as HTMLElement;
    const cards = fixture.nativeElement.querySelectorAll(
      'anarchitects-ui-card',
    );
    const input = fixture.nativeElement.querySelector(
      'input[anarchitectsuiinput]',
    ) as HTMLInputElement;

    expect(root.getAttribute('data-anx-theme')).toBe('ocean');
    expect(root.getAttribute('data-anx-density')).toBe('comfortable');
    expect(root.getAttribute('data-anx-surface')).toBe('card');
    expect(root.getAttribute('data-anx-layout')).toBe('grid');
    expect(cards.length).toBeGreaterThan(0);
    expect(input.placeholder).toBe('First Name');
  });

  it('should expose layout definitions and defaults through DI', () => {
    fixture.detectChanges();

    const definitions = fixture.componentRef.injector.get(
      ANX_LAYOUT_DEFINITIONS,
    );
    const defaults = fixture.componentRef.injector.get(ANX_LAYOUT_DEFAULTS);

    expect(definitions.length).toBeGreaterThan(0);
    expect(
      definitions.some((definition) => definition.id === 'form:card'),
    ).toBe(true);
    expect(defaults['form']).toBe('form:stacked');
  });

  it('should map form layout options for spacing and action alignment', () => {
    fixture.componentInstance.kind.set('form');
    fixture.componentInstance.layout.set('form:grid');
    fixture.componentInstance.layoutOptions.set({
      spacing: 'compact',
      actionAlignment: 'center',
      columns: 3,
    });
    fixture.detectChanges();

    const renderer = fixture.nativeElement.querySelector(
      'anarchitects-ui-default-form-layout-renderer',
    ) as HTMLElement;
    const grid = fixture.nativeElement.querySelector(
      '.anx-default-layout__form-grid',
    ) as HTMLElement;

    expect(
      renderer.style.getPropertyValue('--anx-layout-form-gap').trim(),
    ).toBe('var(--anx-sys-space-sm)');
    expect(
      renderer.style
        .getPropertyValue('--anx-layout-form-actions-justify')
        .trim(),
    ).toBe('center');
    expect(grid.style.getPropertyValue('--anx-layout-columns').trim()).toBe(
      '3',
    );
  });

  it('should support relaxed spacing and between action alignment', () => {
    fixture.componentInstance.kind.set('form');
    fixture.componentInstance.layout.set('form:stacked');
    fixture.componentInstance.layoutOptions.set({
      spacing: 'relaxed',
      actionAlignment: 'between',
    });
    fixture.detectChanges();

    const renderer = fixture.nativeElement.querySelector(
      'anarchitects-ui-default-form-layout-renderer',
    ) as HTMLElement;

    expect(
      renderer.style.getPropertyValue('--anx-layout-form-gap').trim(),
    ).toBe('var(--anx-sys-space-lg)');
    expect(
      renderer.style
        .getPropertyValue('--anx-layout-form-actions-justify')
        .trim(),
    ).toBe('space-between');
  });

  it('should render list:table layout with table structure', () => {
    fixture.componentInstance.kind.set('list');
    fixture.componentInstance.layout.set('list:table');
    fixture.componentInstance.layoutOptions.set({});
    fixture.componentInstance.model.set({
      title: 'List',
      items: [{ name: 'Alpha' }, { name: 'Beta' }],
    });
    fixture.detectChanges();

    const table = fixture.nativeElement.querySelector('table');
    const cell = fixture.nativeElement.querySelector('td strong');

    expect(table).not.toBeNull();
    expect(cell.textContent.trim()).toBe('Alpha');
  });

  it('should render detail:sidebar with sidebar slot region', () => {
    fixture.componentInstance.kind.set('detail');
    fixture.componentInstance.layout.set('detail:sidebar');
    fixture.componentInstance.model.set({ title: 'Profile' });
    fixture.detectChanges();

    const sidebar = fixture.nativeElement.querySelector(
      '[data-anx-slot="sidebar"] .detail-sidebar',
    ) as HTMLElement;

    expect(sidebar.textContent?.trim()).toBe('Sidebar: Profile');
  });
});
