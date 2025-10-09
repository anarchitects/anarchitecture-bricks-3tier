import { Controller, Get, HttpStatus, Param, Post } from '@nestjs/common';
import { RouteSchema } from '@nestjs/platform-fastify';
import { ContactsService } from '../../application/contacts.service';
import {
  ContactRequestDto,
  ContactRequestSchema,
  ContactResponseDto,
  ContactResponseSchema,
} from '@anarchitects/contacts-ts/dtos';

@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

  @Get()
  findContacts() {
    return this.contactsService.getContacts();
  }

  @Get(':id')
  findContactById(@Param('id') id: string) {
    return this.contactsService.getContact(id);
  }

  @Post()
  @RouteSchema({
    body: ContactRequestSchema,
    response: { [HttpStatus.CREATED]: ContactResponseSchema },
  })
  async createContact(
    requestBody: ContactRequestDto
  ): Promise<ContactResponseDto> {
    await this.contactsService.createContact(requestBody);
    return { success: true };
  }
}
