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
  PrimitiveSize,
  PrimitiveTone,
} from '@anarchitects/common-angular-ui-primitives/contracts';

@Component({
  selector: 'anarchitects-ui-button',
  templateUrl: './button.html',
  styleUrl: './button.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'anx-button anx-action',
    '[attr.data-tone]': 'tone()',
    '[attr.data-appearance]': 'appearance()',
    '[attr.data-size]': 'size()',
    '[attr.data-density]': 'density()',
    '[attr.data-loading]': 'loading() ? "true" : null',
    '[attr.data-disabled]': 'disabled() ? "true" : null',
    '[attr.aria-busy]': 'loading() ? "true" : null',
  },
})
export class AnarchitectsUiButton {
  readonly tone = input<PrimitiveTone>('neutral');
  readonly appearance = input<PrimitiveAppearance>('solid');
  readonly size = input<PrimitiveSize>('md');
  readonly density = input<PrimitiveDensity>('comfortable');
  readonly disabled = input(false);
  readonly loading = input(false);
  readonly type = input<'button' | 'submit' | 'reset'>('button');

  readonly pressed = output<MouseEvent>();

  constructor() {
    effect(() => {
      applyAnxBaseStyles();
    });
  }

  onClick(event: MouseEvent): void {
    if (this.disabled() || this.loading()) {
      event.preventDefault();
      event.stopPropagation();
      return;
    }

    this.pressed.emit(event);
  }
}
