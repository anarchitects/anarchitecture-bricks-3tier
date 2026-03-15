import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
} from '@angular/core';
import { applyAnxBaseStyles } from '@anarchitects/common-angular-design/styles';
import {
  PrimitiveCardAppearance,
  PrimitiveDensity,
} from '@anarchitects/common-angular-ui-primitives/contracts';

@Component({
  selector: 'anarchitects-ui-card',
  templateUrl: './card.html',
  styleUrl: './card.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'anx-card anx-surface anx-stack',
    '[attr.data-appearance]': 'appearance()',
    '[attr.data-density]': 'density()',
  },
})
export class AnarchitectsUiCard {
  readonly appearance = input<PrimitiveCardAppearance>('outlined');
  readonly density = input<PrimitiveDensity>('comfortable');

  constructor() {
    effect(() => {
      applyAnxBaseStyles();
    });
  }
}
