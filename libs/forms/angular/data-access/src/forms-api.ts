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
  SubmissionsQueryDTO,
  SubmissionsResponseDTO,
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

  getSubmissions(filters: SubmissionsQueryDTO = {}) {
    let params = new HttpParams();
    if (filters.formId !== undefined) {
      params = params.set('formId', filters.formId);
    }
    if (filters.formVersion !== undefined) {
      params = params.set('formVersion', String(filters.formVersion));
    }

    return this.http.get<SubmissionsResponseDTO>(
      `${this.resourceUrl}/submissions`,
      { params },
    );
  }

  getSubmission(submissionId: string) {
    return this.http.get<SubmissionResponseDTO>(
      `${this.resourceUrl}/submissions/${encodeURIComponent(submissionId)}`,
    );
  }

  submitForm(dto: SubmissionRequestDTO) {
    return this.http.post<SubmissionResponseDTO>(
      `${this.resourceUrl}/submit`,
      dto,
    );
  }
}
