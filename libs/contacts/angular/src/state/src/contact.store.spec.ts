import { ContactStore } from './contact.store';
import { Contact } from '@anarchitects/contacts-ts/models';
import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { faker } from '@faker-js/faker';
import { ContactsApi } from '../../data-access/src/services/contacts-api';
import { delay, of } from 'rxjs';
import { ContactRequestDto } from '@anarchitects/contacts-ts';

describe('Contact', () => {
  const mockContact: Contact = {
    id: faker.string.uuid(),
    name: faker.person.fullName(),
    email: faker.internet.email(),
    message: faker.lorem.sentence(),
  };

  const setup = () => {
    vi.clearAllMocks();
    const contactsApi = {
      getContacts: vi.fn(() => of([mockContact]).pipe(delay(100))),
      getContactById: vi.fn(() => of(mockContact).pipe(delay(100))),
      createContact: vi.fn((data: ContactRequestDto) =>
        of({ success: !!data }).pipe(delay(100))
      ),
    };

    TestBed.configureTestingModule({
      providers: [
        ContactStore,
        { provide: ContactsApi, useValue: contactsApi },
      ],
    });

    return TestBed.inject(ContactStore);
  };

  it('should create an instance', () => {
    const store = setup();
    expect(store).toBeTruthy();
  });
  it('should load all contacts', fakeAsync(() => {
    const store = setup();
    store.loadContacts();
    expect(store.loading()).toBe(true);
    tick(100);
    expect(store.entities().length).toBe(1);
    expect(store.entities()).toEqual([mockContact]);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
  }));
  it('should load a contact by id', fakeAsync(() => {
    const store = setup();
    store.selectContact(mockContact.id);
    expect(store.loading()).toBe(true);
    tick(100);
    expect(store.selectedContact()).toEqual(mockContact);
    expect(store.loading()).toBe(false);
    expect(store.error()).toBeNull();
    expect(store.selectedId()).toBe(mockContact.id);
  }));
  it('should create a contact', fakeAsync(() => {
    const store = setup();
    const contactData: ContactRequestDto = {
      name: faker.person.fullName(),
      email: faker.internet.email(),
      message: faker.lorem.sentence(),
    };
    store.submitForm(contactData);
    expect(store.loading()).toBe(true);
    tick(100);
    expect(store.success()).toBe(true);
    expect(store.error()).toBeNull();
    expect(store.loading()).toBe(false);
  }));
});
