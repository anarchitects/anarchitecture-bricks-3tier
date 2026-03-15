import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
} from '@angular/core';
import { applyAnxBaseStyles } from '@anarchitects/common-angular-design/styles';
import {
  PrimitiveSize,
  PrimitiveTone,
} from '@anarchitects/common-angular-ui-primitives/contracts';

@Component({
  selector: 'anarchitects-ui-spinner',
  templateUrl: './spinner.html',
  styleUrl: './spinner.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'anx-spinner anx-inline',
    '[attr.data-size]': 'size()',
    '[attr.data-tone]': 'tone()',
    'attr.data-anx-component': '"spinner"',
    role: 'status',
  },
})
export class AnarchitectsUiSpinner {
  readonly size = input<PrimitiveSize>('md');
  readonly tone = input<PrimitiveTone>('primary');
  readonly label = input('Loading');

  constructor() {
    effect(() => {
      applyAnxBaseStyles();
    });
  }
}
