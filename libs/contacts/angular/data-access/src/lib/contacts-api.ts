import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  ContactRequestDto,
  ContactResponseDto,
} from '@anarchitects/contacts-ts-dtos';

@Injectable({
  providedIn: 'root',
})
export class ContactsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/contacts';

  createContact(contactData: ContactRequestDto) {
    return this.http.post<ContactResponseDto>(this.baseUrl, contactData);
  }
}
