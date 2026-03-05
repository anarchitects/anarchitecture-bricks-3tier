import { TestBed } from '@angular/core/testing';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { FormsApi } from './forms-api';
import { provideHttpClient } from '@angular/common/http';
import { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';

describe('FormsApi', () => {
  let service: FormsApi;
  let controller: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [FormsApi, provideHttpClient(), provideHttpClientTesting()],
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
    it('should fetch form definition', () => {
      const mockResponse = {
        config: { id: 'form1', name: 'Test Form' },
        schema: {},
      };
      service.getDefinition('form1').subscribe((response) => {
        expect(response).toEqual(mockResponse);
      });

      const req = controller.expectOne('/api/forms/form1');
      expect(req.request.method).toBe('GET');
      req.flush(mockResponse);
    });
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
