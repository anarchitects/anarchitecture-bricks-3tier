import { Directive, computed, input } from '@angular/core';
import {
  AnxSlotName,
  normalizeAnxSlotName,
} from '@anarchitects/common-angular-ui-composition/contracts';

@Directive({
  selector: '[anxSlot]',
  standalone: true,
  host: {
    '[attr.data-anx-slot]': 'normalizedSlotName()',
  },
})
export class AnxSlotDirective {
  readonly anxSlot = input<AnxSlotName | string>('content');

  readonly normalizedSlotName = computed(() => {
    return normalizeAnxSlotName(this.anxSlot());
  });
}
