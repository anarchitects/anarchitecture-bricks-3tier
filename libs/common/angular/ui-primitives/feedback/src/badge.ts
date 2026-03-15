import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
} from '@angular/core';
import { applyAnxBaseStyles } from '@anarchitects/common-angular-design/styles';
import {
  PrimitiveAppearance,
  PrimitiveSize,
  PrimitiveTone,
} from '@anarchitects/common-angular-ui-primitives/contracts';

@Component({
  selector: 'anarchitects-ui-badge',
  templateUrl: './badge.html',
  styleUrl: './badge.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'anx-badge anx-inline',
    '[attr.data-tone]': 'tone()',
    '[attr.data-appearance]': 'appearance()',
    '[attr.data-size]': 'size()',
    'attr.data-anx-component': '"badge"',
  },
})
export class AnarchitectsUiBadge {
  readonly tone = input<PrimitiveTone>('neutral');
  readonly appearance = input<PrimitiveAppearance>('solid');
  readonly size = input<PrimitiveSize>('md');

  constructor() {
    effect(() => {
      applyAnxBaseStyles();
    });
  }
}
