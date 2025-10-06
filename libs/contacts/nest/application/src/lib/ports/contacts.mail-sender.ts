export abstract class ContactsMailSender {
  abstract sendMail(to: string, subject: string, body: string): Promise<void>;
}

export const CONTACTS_MAIL_SENDER = Symbol('CONTACTS_MAIL_SENDER');
