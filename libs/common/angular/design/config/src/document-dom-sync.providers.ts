import { DOCUMENT } from '@angular/common';
import { APP_INITIALIZER, Provider, inject } from '@angular/core';
import {
  ANX_DESIGN_ROOT_HOST_CLASS,
  ANX_DESIGN_ROOT_MANAGED_ATTRIBUTES,
  ANX_DESIGN_ROOT_MANAGED_KEYS,
  pickAnxDesignRootContext,
} from './design-root.contract';
import { injectDesignSystemConfig } from './config.tokens';

export function provideDocumentDesignSystemDomSync(): Provider[] {
  return [
    {
      provide: APP_INITIALIZER,
      multi: true,
      useFactory: () => {
        const documentRef = inject(DOCUMENT, { optional: true });
        const config = pickAnxDesignRootContext(injectDesignSystemConfig());

        return () => {
          syncDocumentDesignSystemDom(documentRef, config);
        };
      },
    },
  ];
}

function syncDocumentDesignSystemDom(
  documentRef: Document | null,
  config: ReturnType<typeof pickAnxDesignRootContext>,
): void {
  const root = documentRef?.documentElement;
  if (!root) {
    return;
  }

  root.classList.add(ANX_DESIGN_ROOT_HOST_CLASS);

  for (const key of ANX_DESIGN_ROOT_MANAGED_KEYS) {
    const attributeName = ANX_DESIGN_ROOT_MANAGED_ATTRIBUTES[key];
    if (root.hasAttribute(attributeName)) {
      continue;
    }

    root.setAttribute(attributeName, config[key]);
  }
}
