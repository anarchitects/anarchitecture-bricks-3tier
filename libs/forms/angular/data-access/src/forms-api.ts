import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import {
  injectApiBaseUrl,
  injectApiResourcePath,
} from '@anarchitects/forms-angular/config';
import { FormConfig } from '@anarchitects/forms-ts/models';
import {
  SubmissionRequestDTO,
  SubmissionResponseDTO,
} from '@anarchitects/forms-ts/dtos';

@Injectable({
  providedIn: 'root',
})
export class FormsApi {
  private readonly http = inject(HttpClient);
  private readonly resourceUrl = `${injectApiBaseUrl().replace(/\/$/, '')}/${injectApiResourcePath()}`;

  getDefinition(formId: string, formVersion?: number) {
    const params =
      formVersion !== undefined
        ? new HttpParams().set('formVersion', String(formVersion))
        : undefined;

    return this.http.get<{ config: FormConfig; schema: unknown }>(
      `${this.resourceUrl}/${formId}`,
      { params },
    );
  }

  submitForm(dto: SubmissionRequestDTO) {
    return this.http.post<SubmissionResponseDTO>(
      `${this.resourceUrl}/submit`,
      dto,
    );
  }
}
