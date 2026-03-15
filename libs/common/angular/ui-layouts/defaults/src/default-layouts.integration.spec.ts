import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnxLayoutId } from '@anarchitects/common-angular-ui-layouts/contracts';
import { AnarchitectsUiInputDirective } from '@anarchitects/common-angular-ui-primitives/form-controls';
import { AnxTemplateDirective } from '@anarchitects/common-angular-ui-composition/templates';
import { AnarchitectsUiLayoutHost } from '@anarchitects/common-angular-ui-layouts/host';
import { provideAnxDefaultLayouts } from './default-layout.providers';

@Component({
  imports: [
    AnarchitectsUiLayoutHost,
    AnxTemplateDirective,
    AnarchitectsUiInputDirective,
  ],
  providers: [...provideAnxDefaultLayouts()],
  template: `
    <anarchitects-ui-layout-host
      [kind]="kind()"
      [layout]="layout()"
      [model]="model()"
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
        <article class="detail-content">{{ detail.title ?? 'Detail' }}</article>
      </ng-template>

      <ng-template anxTemplate="sidebar" let-detail>
        <div class="detail-sidebar">
          Sidebar: {{ detail.title ?? 'Detail' }}
        </div>
      </ng-template>
    </anarchitects-ui-layout-host>
  `,
})
class HostComponent {
  readonly kind = signal<'form' | 'list' | 'detail'>('form');
  readonly layout = signal<AnxLayoutId | null>('form:card');
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

    const cards = fixture.nativeElement.querySelectorAll(
      'anarchitects-ui-card',
    );
    expect(cards.length).toBeGreaterThan(0);
  });

  it('should render list:table layout with table structure', () => {
    fixture.componentInstance.kind.set('list');
    fixture.componentInstance.layout.set('list:table');
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
