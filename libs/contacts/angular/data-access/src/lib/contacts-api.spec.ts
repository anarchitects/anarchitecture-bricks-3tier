import { TestBed } from '@angular/core/testing';
import {
  provideHttpClientTesting,
  HttpTestingController,
} from '@angular/common/http/testing';
import { ContactsApi } from './contacts-api';
import { provideHttpClient } from '@angular/common/http';
import { ContactRequestDto } from '@anarchitects/contacts-ts-dtos';
import { faker } from '@faker-js/faker';

describe('ContactsApi', () => {
  let service: ContactsApi;
  let httpController: HttpTestingController;
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ContactsApi);
    httpController = TestBed.inject(HttpTestingController);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
  describe('createContact', () => {
    it('should create a contact and receive success', () => {
      const contactData: ContactRequestDto = {
        name: faker.person.fullName(),
        email: faker.internet.email(),
        message: faker.lorem.sentence(),
      };
      service.createContact(contactData).subscribe((response) => {
        expect(response).toBeDefined();
        expect(response).toEqual({ success: true });
      });
      const req = httpController.expectOne('/api/contacts');
      expect(req.request.method).toEqual('POST');
      expect(req.request.body).toEqual(contactData);
      req.flush({ success: true });
      httpController.verify();
    });
  });
});
