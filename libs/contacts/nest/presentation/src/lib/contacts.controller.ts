import { Controller, HttpStatus, Post } from '@nestjs/common';
import { RouteSchema } from '@nestjs/platform-fastify';
import { ContactsService } from '@anarchitects/contacts-nest-application';
import {
  ContactRequestDto,
  ContactRequestSchema,
  ContactResponseDto,
  ContactResponseSchema,
} from '@anarchitects/contacts-ts-dtos';

@Controller('contacts')
export class ContactsController {
  constructor(private readonly contactsService: ContactsService) {}

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
