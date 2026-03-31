import { NgComponentOutlet } from '@angular/common';
import {
  AfterContentInit,
  ChangeDetectionStrategy,
  Component,
  ContentChildren,
  DestroyRef,
  QueryList,
  computed,
  inject,
  input,
  signal,
} from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { getRequiredTemplatesForKind } from '@anarchitects/common-angular-ui-layouts/contracts';
import {
  AnxLayoutId,
  AnxLayoutKind,
  AnxResolvedLayoutContext,
} from '@anarchitects/common-angular-ui-layouts/contracts';
import { AnxSlotName } from '@anarchitects/common-angular-ui-composition/contracts';
import { AnxLayoutRegistryService } from '@anarchitects/common-angular-ui-layouts/registry';
import { AnxSlotDirective } from '@anarchitects/common-angular-ui-composition/projection';
import {
  AnxTemplateDirective,
  groupAnxTemplatesByName,
} from '@anarchitects/common-angular-ui-composition/templates';
import { startWith } from 'rxjs';

@Component({
  selector: 'anarchitects-ui-layout-host',
  imports: [NgComponentOutlet],
  templateUrl: './layout-host.component.html',
  styleUrl: './layout-host.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [AnxLayoutRegistryService],
  host: {
    class: 'anx-layout-host',
    '[attr.data-anx-layout-kind]': 'kind()',
    '[attr.data-anx-layout-id]': 'resolvedLayout().definition.id',
    '[attr.data-anx-layout-source]': 'resolvedLayout().source',
  },
})
export class AnarchitectsUiLayoutHost implements AfterContentInit {
  readonly kind = input.required<AnxLayoutKind>();
  readonly layout = input<AnxLayoutId | null>(null);
  readonly model = input<unknown>(null);
  readonly layoutOptions = input<Readonly<Record<string, unknown>>>({});

  @ContentChildren(AnxTemplateDirective, { descendants: true })
  private readonly templateQuery?: QueryList<AnxTemplateDirective>;

  @ContentChildren(AnxSlotDirective, { descendants: true })
  private readonly slotQuery?: QueryList<AnxSlotDirective>;

  private readonly destroyRef = inject(DestroyRef);
  private readonly layoutRegistry = inject(AnxLayoutRegistryService);

  private readonly templates = signal<readonly AnxTemplateDirective[]>([]);
  private readonly slots = signal<readonly AnxSlotDirective[]>([]);

  readonly resolvedLayout = computed(() => {
    return this.layoutRegistry.resolveLayout(
      this.kind(),
      this.layout() ?? undefined,
    );
  });

  readonly templateGroups = computed(() => {
    return groupAnxTemplatesByName(this.templates());
  });

  readonly slotGroups = computed(() => {
    return groupAnxSlotsByName(this.slots());
  });

  readonly resolvedContext = computed<AnxResolvedLayoutContext>(() => {
    const resolvedLayout = this.resolvedLayout();

    for (const templateName of getRequiredTemplatesForKind(
      resolvedLayout.definition.kind,
    )) {
      const templates = this.templateGroups().get(templateName);
      if (!templates?.length) {
        throw new Error(
          `Layout '${resolvedLayout.definition.id}' requires template '${templateName}'.`,
        );
      }
    }

    return {
      layout: resolvedLayout.definition,
      model: this.model(),
      templates: this.templateGroups(),
      slots: this.slotGroups(),
      options: this.layoutOptions(),
    };
  });

  readonly rendererInputs = computed(() => {
    return {
      context: this.resolvedContext(),
    };
  });

  ngAfterContentInit(): void {
    if (this.templateQuery) {
      this.templateQuery.changes
        .pipe(
          startWith(this.templateQuery),
          takeUntilDestroyed(this.destroyRef),
        )
        .subscribe(() => {
          this.templates.set(this.templateQuery?.toArray() ?? []);
        });
    }

    if (this.slotQuery) {
      this.slotQuery.changes
        .pipe(startWith(this.slotQuery), takeUntilDestroyed(this.destroyRef))
        .subscribe(() => {
          this.slots.set(this.slotQuery?.toArray() ?? []);
        });
    }
  }
}

function groupAnxSlotsByName(
  slots: readonly AnxSlotDirective[],
): ReadonlyMap<AnxSlotName, readonly AnxSlotDirective[]> {
  const groups = new Map<AnxSlotName, AnxSlotDirective[]>();

  for (const slot of slots) {
    const slotName = slot.normalizedSlotName();
    if (!slotName) {
      continue;
    }

    const existing = groups.get(slotName) ?? [];
    existing.push(slot);
    groups.set(slotName, existing);
  }

  return groups;
}
