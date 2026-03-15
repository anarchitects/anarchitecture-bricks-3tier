import { Component, QueryList, ViewChildren } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnxTemplateDirective } from './template.directive';
import { findAnxTemplate, groupAnxTemplatesByName } from './template-registry';

@Component({
  imports: [AnxTemplateDirective],
  template: `
    <ng-template anxTemplate="item" let-item>{{ item }}</ng-template>
    <ng-template anxTemplate="item" anxTemplateVariant="compact" let-item>
      compact {{ item }}
    </ng-template>
    <ng-template anxTemplate="app-dashboard-card" let-item>
      card {{ item }}
    </ng-template>
  `,
})
class HostComponent {
  @ViewChildren(AnxTemplateDirective)
  templates!: QueryList<AnxTemplateDirective>;
}

describe('AnxTemplateDirective', () => {
  let fixture: ComponentFixture<HostComponent>;
  let templates: AnxTemplateDirective[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();

    templates = fixture.componentInstance.templates.toArray();
  });

  it('should register templates and group by normalized name', () => {
    const groups = groupAnxTemplatesByName(templates);
    expect(groups.get('item')).toHaveLength(2);
    expect(groups.get('app-dashboard-card')).toHaveLength(1);
  });

  it('should resolve templates by name and variant', () => {
    const defaultItemTemplate = findAnxTemplate(templates, 'item');
    const compactItemTemplate = findAnxTemplate(templates, 'item', 'compact');
    const fallbackItemTemplate = findAnxTemplate(templates, 'item', 'full');
    const customTemplate = findAnxTemplate(templates, 'app-dashboard-card');
    const unknownTemplate = findAnxTemplate(templates, 'unknown');

    expect(defaultItemTemplate).not.toBeNull();
    expect(compactItemTemplate).not.toBeNull();
    expect(fallbackItemTemplate).toBe(defaultItemTemplate);
    expect(customTemplate).not.toBeNull();
    expect(unknownTemplate).toBeNull();
  });
});
