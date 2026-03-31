import { Directive, ElementRef, computed, inject, input } from '@angular/core';
import {
  ANX_DESIGN_ROOT_MANAGED_ATTRIBUTES,
  AnxDesignRootManagedKey,
  pickAnxDesignRootContext,
  resolveAnxDesignRootValue,
} from './design-root.contract';
import { injectDesignSystemConfig } from './config.tokens';

@Directive({
  selector: '[anarchitectsDesignRoot]',
  host: {
    class: 'anx-root',
    '[attr.data-anx-theme]': 'resolvedTheme()',
    '[attr.data-anx-density]': 'resolvedDensity()',
    '[attr.data-anx-surface]': 'resolvedSurface()',
  },
})
export class AnxDesignRootDirective {
  readonly designTheme = input<string | null>(null);
  readonly designDensity = input<string | null>(null);
  readonly designSurface = input<string | null>(null);

  private readonly elementRef = inject(ElementRef<HTMLElement>);
  private readonly config = pickAnxDesignRootContext(
    injectDesignSystemConfig(),
  );
  private readonly explicitAttributes = {
    theme: this.readInitialAttribute('theme'),
    density: this.readInitialAttribute('density'),
    surface: this.readInitialAttribute('surface'),
  } as const;

  readonly resolvedTheme = computed(() => {
    return resolveAnxDesignRootValue({
      inputValue: this.designTheme(),
      attributeValue: this.explicitAttributes.theme,
      configValue: this.config.theme,
    }).value;
  });

  readonly resolvedDensity = computed(() => {
    return resolveAnxDesignRootValue({
      inputValue: this.designDensity(),
      attributeValue: this.explicitAttributes.density,
      configValue: this.config.density,
    }).value;
  });

  readonly resolvedSurface = computed(() => {
    return resolveAnxDesignRootValue({
      inputValue: this.designSurface(),
      attributeValue: this.explicitAttributes.surface,
      configValue: this.config.surface,
    }).value;
  });

  private readInitialAttribute(key: AnxDesignRootManagedKey): string | null {
    return this.elementRef.nativeElement.getAttribute(
      ANX_DESIGN_ROOT_MANAGED_ATTRIBUTES[key],
    );
  }
}
