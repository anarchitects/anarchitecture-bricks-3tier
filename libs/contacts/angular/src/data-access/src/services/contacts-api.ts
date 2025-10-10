import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import {
  ContactRequestDto,
  ContactResponseDto,
} from '@anarchitects/contacts-ts/dtos';
import { Contact } from '@anarchitects/contacts-ts/models';

@Injectable({
  providedIn: 'root',
})
export class ContactsApi {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api/contacts';

  getContacts() {
    return this.http.get<Contact[]>(this.baseUrl);
  }

  getContactById(id: string) {
    return this.http.get<Contact>(`${this.baseUrl}/${id}`);
  }

  createContact(contactData: ContactRequestDto) {
    return this.http.post<ContactResponseDto>(this.baseUrl, contactData);
  }
}
