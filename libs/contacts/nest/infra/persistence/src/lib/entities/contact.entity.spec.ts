import { ContactEntity } from './contact.entity';
import { faker } from '@faker-js/faker';

describe('ContactEntity', () => {
  const mockContact = {
    email: faker.internet.email(),
    name: faker.person.fullName(),
    message: faker.lorem.sentence(),
    createdAt: faker.date.recent(),
    updatedAt: faker.date.recent(),
  };
  it('should be defined', () => {
    expect(new ContactEntity(mockContact)).toBeDefined();
  });
  it('should create an instance with given partial data', () => {
    const contactEntity = new ContactEntity(mockContact);
    expect(contactEntity).toMatchObject(mockContact);
    expect(contactEntity.id).toBeDefined();
  });
});
