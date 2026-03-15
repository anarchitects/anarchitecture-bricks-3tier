import { Directive, effect, input } from '@angular/core';
import { applyAnxBaseStyles } from '@anarchitects/common-angular-design/styles';
import {
  PrimitiveDensity,
  PrimitiveSize,
} from '@anarchitects/common-angular-ui-primitives/contracts';
import { applyAnxFormControlStyles } from './form-control-styles';

@Directive({
  selector: 'input[anarchitectsUiInput]',
  host: {
    class: 'anx-input',
    '[attr.data-size]': 'size()',
    '[attr.data-density]': 'density()',
    '[attr.data-invalid]': 'invalid() ? "true" : null',
    '[attr.aria-invalid]': 'invalid() ? "true" : null',
    '[attr.readonly]': 'isReadonly() ? "" : null',
  },
})
export class AnarchitectsUiInputDirective {
  readonly size = input<PrimitiveSize>('md');
  readonly density = input<PrimitiveDensity>('comfortable');
  readonly invalid = input(false);
  readonly isReadonly = input(false);

  constructor() {
    effect(() => {
      applyAnxBaseStyles();
      applyAnxFormControlStyles();
    });
  }
}
