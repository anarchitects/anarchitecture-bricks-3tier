import { inject, Injectable } from '@angular/core';
import {
  IDENTITY_API_BASE_URL,
  IDENTITY_API_RESOURCE_PATH,
} from '@anarchitects/identity-angular/config';

@Injectable()
export class IdentityApi {
  readonly baseUrl = inject(IDENTITY_API_BASE_URL, { optional: true });
  readonly resourcePath = inject(IDENTITY_API_RESOURCE_PATH);
}
