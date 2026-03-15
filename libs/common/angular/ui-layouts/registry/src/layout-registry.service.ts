import { Injectable, inject } from '@angular/core';
import {
  AnxLayoutDefinition,
  AnxLayoutId,
  AnxLayoutKind,
  isAnxLayoutId,
  isAnxLayoutKind,
  parseAnxLayoutId,
} from '@anarchitects/common-angular-ui-layouts/contracts';
import {
  ANX_LAYOUT_DEFINITIONS,
  injectAnxLayoutDefaults,
} from './layout-registry.tokens';
import { AnxResolvedLayout } from './layout-registry.types';

@Injectable()
export class AnxLayoutRegistryService {
  private readonly definitions = inject(ANX_LAYOUT_DEFINITIONS);
  private readonly defaults = injectAnxLayoutDefaults();

  private readonly definitionsById = new Map<
    AnxLayoutId,
    AnxLayoutDefinition
  >();
  private readonly definitionsByKind = new Map<
    AnxLayoutKind,
    AnxLayoutDefinition[]
  >();

  constructor() {
    this.initializeRegistry();
  }

  listLayouts(kind?: AnxLayoutKind): readonly AnxLayoutDefinition[] {
    if (kind) {
      return this.definitionsByKind.get(kind) ?? [];
    }

    return this.definitions;
  }

  getLayoutById(id: AnxLayoutId): AnxLayoutDefinition | null {
    return this.definitionsById.get(id) ?? null;
  }

  resolveLayout(
    kind: AnxLayoutKind,
    explicitLayoutId?: AnxLayoutId,
  ): AnxResolvedLayout {
    if (!isAnxLayoutKind(kind)) {
      throw new Error(`Invalid layout kind '${kind}'.`);
    }

    if (explicitLayoutId) {
      return {
        definition: this.getRequiredLayout(explicitLayoutId, kind),
        source: 'explicit',
      };
    }

    const defaultLayoutId = this.defaults[kind] as AnxLayoutId | undefined;
    if (defaultLayoutId) {
      return {
        definition: this.getRequiredLayout(defaultLayoutId, kind),
        source: 'default',
      };
    }

    const fallback = this.definitionsByKind.get(kind)?.[0] ?? null;
    if (!fallback) {
      throw new Error(`No registered layouts found for kind '${kind}'.`);
    }

    return {
      definition: fallback,
      source: 'fallback',
    };
  }

  private initializeRegistry(): void {
    for (const definition of this.definitions) {
      this.validateDefinition(definition);

      if (this.definitionsById.has(definition.id)) {
        throw new Error(
          `Duplicate layout definition id '${definition.id}' was registered.`,
        );
      }

      this.definitionsById.set(definition.id, definition);

      const existingByKind = this.definitionsByKind.get(definition.kind) ?? [];
      existingByKind.push(definition);
      this.definitionsByKind.set(definition.kind, existingByKind);
    }
  }

  private validateDefinition(definition: AnxLayoutDefinition): void {
    if (!isAnxLayoutId(definition.id)) {
      throw new Error(`Invalid layout id '${definition.id}'.`);
    }

    const parsedId = parseAnxLayoutId(definition.id);
    if (!parsedId) {
      throw new Error(`Invalid layout id '${definition.id}'.`);
    }

    if (parsedId.kind !== definition.kind) {
      throw new Error(
        `Layout id '${definition.id}' does not match declared kind '${definition.kind}'.`,
      );
    }
  }

  private getRequiredLayout(
    id: AnxLayoutId,
    expectedKind: AnxLayoutKind,
  ): AnxLayoutDefinition {
    const parsedId = parseAnxLayoutId(id);
    if (!parsedId) {
      throw new Error(`Invalid layout id '${id}'.`);
    }

    if (parsedId.kind !== expectedKind) {
      throw new Error(
        `Layout id '${id}' does not match requested kind '${expectedKind}'.`,
      );
    }

    const definition = this.definitionsById.get(id);
    if (!definition) {
      throw new Error(`Layout '${id}' is not registered.`);
    }

    return definition;
  }
}
