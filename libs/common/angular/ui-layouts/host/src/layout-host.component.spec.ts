import {
  Component,
  computed,
  input,
  signal,
  ChangeDetectionStrategy,
} from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import {
  AnxLayoutDefinition,
  AnxResolvedLayoutContext,
  createAnxLayoutId,
} from '@anarchitects/common-angular-ui-layouts/contracts';
import {
  provideAnxLayoutDefaults,
  provideAnxLayouts,
} from '@anarchitects/common-angular-ui-layouts/registry';
import { AnxTemplateDirective } from '@anarchitects/common-angular-ui-composition/templates';
import { AnarchitectsUiLayoutHost } from './layout-host.component';

@Component({
  selector: 'anarchitects-test-list-layout',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <p class="layout-id">{{ context().layout.id }}</p>
    <p class="item-count">{{ itemCount() }}</p>
  `,
})
class TestListLayoutRenderer {
  readonly context = input.required<AnxResolvedLayoutContext>();

  readonly itemCount = computed(() => {
    const model = this.context().model as { items?: unknown[] } | null;
    return model?.items?.length ?? 0;
  });
}

const TEST_LIST_LAYOUTS: readonly AnxLayoutDefinition[] = [
  {
    id: createAnxLayoutId('list', 'list'),
    kind: 'list',
    renderer: TestListLayoutRenderer,
    supportedTemplates: ['item'],
    supportedSlots: ['header', 'toolbar', 'footer', 'empty'],
    description: 'List layout',
  },
  {
    id: createAnxLayoutId('list', 'grid'),
    kind: 'list',
    renderer: TestListLayoutRenderer,
    supportedTemplates: ['item'],
    supportedSlots: ['header', 'toolbar', 'footer', 'empty'],
    description: 'Grid layout',
  },
];

@Component({
  imports: [AnarchitectsUiLayoutHost, AnxTemplateDirective],
  providers: [
    ...provideAnxLayouts(TEST_LIST_LAYOUTS),
    provideAnxLayoutDefaults({ list: 'list:grid' }),
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <anarchitects-ui-layout-host
      [kind]="'list'"
      [layout]="layoutId()"
      [model]="model()"
    >
      <ng-template anxTemplate="item" let-item>{{ item.name }}</ng-template>
    </anarchitects-ui-layout-host>
  `,
})
class HostComponent {
  readonly layoutId = signal<'list:list' | 'list:grid' | null>(null);
  readonly model = signal({
    items: [{ name: 'One' }, { name: 'Two' }],
  });
}

@Component({
  imports: [AnarchitectsUiLayoutHost],
  providers: [...provideAnxLayouts(TEST_LIST_LAYOUTS)],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <anarchitects-ui-layout-host [kind]="'list'" [model]="{ items: [1, 2] }" />
  `,
})
class MissingTemplateHostComponent {}

describe('AnarchitectsUiLayoutHost', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
  });

  it('should resolve provider defaults when explicit layout is missing', () => {
    fixture.detectChanges();

    const host = fixture.nativeElement.querySelector(
      'anarchitects-ui-layout-host',
    ) as HTMLElement;
    const layoutId = fixture.nativeElement.querySelector(
      '.layout-id',
    ) as HTMLElement;

    expect(host.getAttribute('data-anx-layout-id')).toBe('list:grid');
    expect(layoutId.textContent?.trim()).toBe('list:grid');
  });

  it('should allow explicit layout overrides and runtime switching', () => {
    fixture.detectChanges();

    fixture.componentInstance.layoutId.set('list:list');
    fixture.detectChanges();

    let layoutId = fixture.nativeElement.querySelector(
      '.layout-id',
    ) as HTMLElement;
    expect(layoutId.textContent?.trim()).toBe('list:list');

    fixture.componentInstance.layoutId.set('list:grid');
    fixture.detectChanges();

    layoutId = fixture.nativeElement.querySelector('.layout-id') as HTMLElement;
    expect(layoutId.textContent?.trim()).toBe('list:grid');
  });

  it('should pass model context to layout renderers', () => {
    fixture.detectChanges();

    const count = fixture.nativeElement.querySelector(
      '.item-count',
    ) as HTMLElement;
    expect(count.textContent?.trim()).toBe('2');
  });

  it('should throw when required templates are missing', async () => {
    await TestBed.resetTestingModule();
    await TestBed.configureTestingModule({
      imports: [MissingTemplateHostComponent],
    }).compileComponents();

    const missingFixture = TestBed.createComponent(
      MissingTemplateHostComponent,
    );
    expect(() => missingFixture.detectChanges()).toThrow(
      /requires template 'item'/,
    );
  });
});
