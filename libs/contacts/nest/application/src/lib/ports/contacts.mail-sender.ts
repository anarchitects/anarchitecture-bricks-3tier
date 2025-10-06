export abstract class ContactsMailSender {
  abstract sendMail(
    name: string,
    email: string,
    message: string
  ): Promise<void>;
}

export const CONTACTS_MAIL_SENDER = Symbol('CONTACTS_MAIL_SENDER');
