import { DataSource } from 'typeorm';
import {
  NewsletterConsentEntity,
  NewsletterNativeSubscriberEntity,
  NewsletterNativeTokenEntity,
  CreateNewsletterConsentEvents1791244800000,
  CreateNewsletterNativeSubscribers1791288000000,
} from '@anarchitects/newsletter-nest/infrastructure-persistence';

export function createNewsletterDataSource(url: string): DataSource {
  return new DataSource({
    type: 'postgres',
    url,
    synchronize: false,
    entities: [
      NewsletterConsentEntity,
      NewsletterNativeSubscriberEntity,
      NewsletterNativeTokenEntity,
    ],
    migrations: [
      CreateNewsletterConsentEvents1791244800000,
      CreateNewsletterNativeSubscribers1791288000000,
    ],
  });
}
