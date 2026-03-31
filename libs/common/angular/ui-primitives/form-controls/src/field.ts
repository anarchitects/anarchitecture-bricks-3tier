import {
  ChangeDetectionStrategy,
  Component,
  effect,
  input,
} from '@angular/core';
import { applyAnxBaseStyles } from '@anarchitects/common-angular-design/styles';
import { PrimitiveDensity } from '@anarchitects/common-angular-ui-primitives/contracts';
import { applyAnxFormControlStyles } from './form-control-styles';

let nextFieldId = 0;

@Component({
  selector: 'anarchitects-ui-field',
  templateUrl: './field.html',
  styleUrl: './field.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'anx-field',
    '[attr.data-density]': 'density()',
    '[attr.data-invalid]': 'invalid() ? "true" : null',
    '[attr.data-disabled]': 'disabled() ? "true" : null',
    'attr.data-anx-component': '"field"',
  },
})
export class AnarchitectsUiField {
  readonly forId = input<string | null>(null);
  readonly required = input(false);
  readonly invalid = input(false);
  readonly disabled = input(false);
  readonly density = input<PrimitiveDensity>('comfortable');

  readonly hintId = `anx-field-hint-${nextFieldId}`;
  readonly errorId = `anx-field-error-${nextFieldId}`;

  constructor() {
    nextFieldId += 1;

    effect(() => {
      applyAnxBaseStyles();
      applyAnxFormControlStyles();
    });
  }
}
