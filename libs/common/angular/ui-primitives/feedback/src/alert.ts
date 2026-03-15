import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
  output,
} from '@angular/core';
import { applyAnxBaseStyles } from '@anarchitects/common-angular-design/styles';
import {
  PrimitiveAppearance,
  PrimitiveDensity,
  PrimitiveTone,
} from '@anarchitects/common-angular-ui-primitives/contracts';

@Component({
  selector: 'anarchitects-ui-alert',
  templateUrl: './alert.html',
  styleUrl: './alert.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'anx-alert anx-inline',
    '[attr.data-tone]': 'tone()',
    '[attr.data-appearance]': 'appearance()',
    '[attr.data-density]': 'density()',
    '[attr.aria-live]': 'ariaLive()',
    '[attr.role]': 'tone() === "danger" ? "alert" : "status"',
    'attr.data-anx-component': '"alert"',
  },
})
export class AnarchitectsUiAlert {
  readonly tone = input<PrimitiveTone>('neutral');
  readonly appearance = input<PrimitiveAppearance>('solid');
  readonly density = input<PrimitiveDensity>('comfortable');
  readonly dismissible = input(false);
  readonly ariaLive = input<'polite' | 'assertive'>('polite');

  readonly dismissed = output<void>();

  constructor() {
    effect(() => {
      applyAnxBaseStyles();
    });
  }

  onDismiss(): void {
    this.dismissed.emit();
  }
}
