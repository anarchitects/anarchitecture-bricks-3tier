import { Directive, TemplateRef, computed, inject, input } from '@angular/core';
import {
  AnxTemplateName,
  normalizeAnxTemplateName,
} from '@anarchitects/common-angular-ui-composition/contracts';

@Directive({
  selector: 'ng-template[anxTemplate]',
  standalone: true,
})
export class AnxTemplateDirective<Context = unknown> {
  readonly anxTemplate = input<AnxTemplateName | string>('content');
  readonly anxTemplateVariant = input<string | null>(null);

  readonly normalizedTemplateName = computed(() => {
    return normalizeAnxTemplateName(this.anxTemplate());
  });

  readonly templateRef = inject(TemplateRef<Context>);
}
