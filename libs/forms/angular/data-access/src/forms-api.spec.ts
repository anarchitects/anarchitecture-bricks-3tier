import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { FormsApi } from './index';
import {
  API_BASE_URL,
  API_RESOURCE_PATH,
} from '@anarchitects/forms-angular/config';
import { provideHttpClient, withXhr } from '@angular/common/http';
import {
  SubmissionRequestDTO,
  SubmissionResponseDTO,
  SubmissionsQueryDTO,
  SubmissionsResponseDTO,
} from '@anarchitects/forms-ts/dtos';
import { Observable } from 'rxjs';
import { expectTypeOf } from 'vitest';

describe('FormsApi', () => {
  let service: FormsApi;
  let controller: HttpTestingController;
  const submission: SubmissionResponseDTO = {
    id: '01900000-0000-7000-8000-000000000001',
    formId: 'contact',
    formVersion: 2,
    payload: { message: 'Hello' },
    createdAt: '2026-10-05T10:00:00.000Z',
    updatedAt: '2026-10-05T10:00:00.000Z',
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        FormsApi,
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
      ],
    });
    service = TestBed.inject(FormsApi);
    controller = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    controller.verify();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
  describe('getDefinition', () => {
    it('should fetch form definition with explicit formVersion query', () => {
      const mockResponse = {
        config: { id: 'form1', version: 2, fields: [] },
        schema: {},
      };
      service.getDefinition('form1', 2).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = controller.expectOne(
        (request) =>
          request.url === '/api/forms/form1' &&
          request.params.get('formVersion') === '2',
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });

    it('should fetch form definition without query params when formVersion is omitted', () => {
      const mockResponse = {
        config: { id: 'form1', version: 1, fields: [] },
        schema: {},
      };

      service.getDefinition('form1').subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = controller.expectOne(
        (request) =>
          request.url === '/api/forms/form1' &&
          request.params.keys().length === 0,
      );
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
  });
  describe('getSubmissions', () => {
    it.each<{ filters?: SubmissionsQueryDTO; params: Record<string, string> }>([
      { params: {} },
      { filters: {}, params: {} },
      { filters: { formId: undefined, formVersion: undefined }, params: {} },
      { filters: { formId: 'contact' }, params: { formId: 'contact' } },
      { filters: { formVersion: 2 }, params: { formVersion: '2' } },
      {
        filters: { formId: 'contact', formVersion: 2 },
        params: { formId: 'contact', formVersion: '2' },
      },
    ])(
      'fetches submissions with only the supplied filters: %j',
      ({ filters, params }) => {
        const response$ = service.getSubmissions(filters);
        expectTypeOf(response$).toEqualTypeOf<
          Observable<SubmissionsResponseDTO>
        >();
        response$.subscribe((response) => {
          expect(response).toEqual([submission]);
          expect(typeof response[0].createdAt).toBe('string');
          expect(typeof response[0].updatedAt).toBe('string');
        });

        const req = controller.expectOne(
          (request) => request.url === '/api/forms/submissions',
        );
        expect(req.request.method).toBe('GET');
        expect(
          Object.fromEntries(
            req.request.params
              .keys()
              .map((key) => [key, req.request.params.get(key)]),
          ),
        ).toEqual(params);
        req.flush([submission]);
      },
    );

    it('preserves an empty list response', () => {
      service
        .getSubmissions()
        .subscribe((response) => expect(response).toEqual([]));
      controller.expectOne('/api/forms/submissions').flush([]);
    });

    it('encodes form IDs as query values', () => {
      service.getSubmissions({ formId: 'contact & feedback' }).subscribe();
      controller
        .expectOne('/api/forms/submissions?formId=contact%20%26%20feedback')
        .flush([]);
    });
  });

  describe('getSubmission', () => {
    it('fetches a submission by ID with DTO date strings', () => {
      const response$ = service.getSubmission(submission.id);
      expectTypeOf(response$).toEqualTypeOf<
        Observable<SubmissionResponseDTO>
      >();
      response$.subscribe((response) => {
        expect(response).toEqual(submission);
        expect(typeof response.createdAt).toBe('string');
        expect(typeof response.updatedAt).toBe('string');
      });
      const req = controller.expectOne(
        `/api/forms/submissions/${submission.id}`,
      );
      expect(req.request.method).toBe('GET');
      expect(req.request.params.keys()).toEqual([]);
      req.flush(submission);
    });

    it('passes a missing submission error to the consumer', () => {
      const onError = vi.fn();
      service.getSubmission(submission.id).subscribe({
        next: () => {
          throw new Error('Expected a 404');
        },
        error: onError,
      });
      controller
        .expectOne(`/api/forms/submissions/${submission.id}`)
        .flush(
          { message: 'Not found' },
          { status: 404, statusText: 'Not Found' },
        );
      expect(onError).toHaveBeenCalledWith(
        expect.objectContaining({ status: 404 }),
      );
    });

    it('encodes the ID as a single path segment', () => {
      service.getSubmission('invalid/id?query').subscribe();
      controller
        .expectOne('/api/forms/submissions/invalid%2Fid%3Fquery')
        .flush(submission);
    });
  });

  it('uses the configured base URL and resource path for reads', () => {
    TestBed.resetTestingModule();
    TestBed.configureTestingModule({
      providers: [
        FormsApi,
        provideHttpClient(withXhr()),
        provideHttpClientTesting(),
        { provide: API_BASE_URL, useValue: '/custom-api/' },
        { provide: API_RESOURCE_PATH, useValue: 'custom-forms' },
      ],
    });
    service = TestBed.inject(FormsApi);
    controller = TestBed.inject(HttpTestingController);
    service.getSubmissions().subscribe();
    service.getSubmission(submission.id).subscribe();
    controller.expectOne('/custom-api/custom-forms/submissions').flush([]);
    controller
      .expectOne(`/custom-api/custom-forms/submissions/${submission.id}`)
      .flush(submission);
  });

  describe('submitForm', () => {
    it('should submit form data', () => {
      const mockRequest: SubmissionRequestDTO = {
        formId: 'form1',
        formVersion: 1,
        payload: { field1: 'value1' },
      };
      const mockResponse = {
        id: 'submission-1',
        formId: 'form1',
        formVersion: 1,
        payload: { field1: 'value1' },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      service.submitForm(mockRequest).subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = controller.expectOne('/api/forms/submit');
      expect(req.request.method).toBe('POST');
      expect(req.request.body).toEqual(mockRequest);
      req.flush(mockResponse);
    });
  });
});
