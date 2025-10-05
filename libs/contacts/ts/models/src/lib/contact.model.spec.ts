import type { Contact } from './contact.model';

test('Contact exposes the exact required properties', () => {
  expectTypeOf<Contact>().toHaveProperty('id').toBeString();
  expectTypeOf<Contact>().toHaveProperty('name').toBeString();
  expectTypeOf<Contact>().toHaveProperty('email').toBeString();
  expectTypeOf<Contact>().toHaveProperty('message').toBeString();
  expectTypeOf<Contact>().toHaveProperty('createdAt').toEqualTypeOf<Date>();
  expectTypeOf<Contact>().toHaveProperty('updatedAt').toEqualTypeOf<Date>();
});

test('Contact requires timestamp fields when constructing a value', () => {
  // @ts-expect-error createdAt is required on Contact
  const missingCreatedAt: Contact = {
    id: 'contact-id',
    name: 'Ada Lovelace',
    email: 'ada.lovelace@example.com',
    message: 'Hello from the analytical engine.',
    updatedAt: new Date('2024-01-02T00:00:00Z'),
  };

  expectTypeOf(missingCreatedAt).toEqualTypeOf<Contact>();
});

test('Contact allows full persisted shape with timestamps', () => {
  const persistedContact: Contact = {
    id: 'contact-id',
    name: 'Ada Lovelace',
    email: 'ada.lovelace@example.com',
    message: 'Let us collaborate on the analytical engine.',
    createdAt: new Date('2024-01-01T00:00:00Z'),
    updatedAt: new Date('2024-01-02T00:00:00Z'),
  };

  expectTypeOf(persistedContact.id).toBeString();
  expectTypeOf(persistedContact.createdAt).toEqualTypeOf<Date>();
  expectTypeOf(persistedContact.updatedAt).toEqualTypeOf<Date>();
});
