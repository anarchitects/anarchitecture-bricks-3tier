import { computed, Injectable, inject } from '@angular/core';
import { IdentityApi } from '@anarchitects/identity-angular/data-access';

@Injectable()
export class IdentityStore {
  private readonly api = inject(IdentityApi);

  readonly resourcePath = computed(() => this.api.resourcePath);
}
