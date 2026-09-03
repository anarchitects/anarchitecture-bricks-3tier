import { Directive, TemplateRef, inject, input } from '@angular/core';

@Directive({
  selector: '[anxSlot]',
  host: {
    '[attr.data-anx-slot]': 'anxSlot()',
  },
})
export class AnarchitectsFormsSlotDirective {
  readonly anxSlot = input.required<string>();
}

@Directive({
  selector: 'ng-template[anxTemplate]',
})
export class AnarchitectsFormsTemplateDirective {
  readonly anxTemplate = input.required<string>();
  readonly templateRef = inject(TemplateRef<unknown>);
}
