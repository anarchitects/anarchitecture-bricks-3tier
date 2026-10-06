import { randomUUID } from 'node:crypto';
import type { DataSource } from 'typeorm';
import type {
  NativeSubscriberRepositoryPort,
  NewsletterNativeTransaction,
} from '../../application';
import { NewsletterNativeSubscriberEntity } from '../entities/newsletter-native-subscriber.entity';
import { NewsletterNativeTokenEntity } from '../entities/newsletter-native-token.entity';

/** PostgreSQL transaction adapter. Never uses the global manager inside a transaction. */
export class TypeOrmNativeSubscriberRepository
  implements NativeSubscriberRepositoryPort
{
  constructor(private readonly dataSource: DataSource) {
    if (dataSource.options.type !== 'postgres')
      throw new Error('Newsletter native persistence requires PostgreSQL.');
  }
  async transact<T>(
    scope: string,
    selector: { email: string } | { tokenHash: string },
    operation: (tx: NewsletterNativeTransaction) => Promise<T>,
  ): Promise<T> {
    return this.dataSource.transaction('READ COMMITTED', async (manager) => {
      const subscribers = manager.getRepository(
        NewsletterNativeSubscriberEntity,
      );
      const tokens = manager.getRepository(NewsletterNativeTokenEntity);
      // Resolve identity only. Token/state are reread after locking, since a concurrent
      // resend/withdrawal may have revoked the authority while this operation waited.
      const lookup =
        'tokenHash' in selector
          ? await tokens.findOne({
              where: { hash: selector.tokenHash },
              relations: { subscriber: true },
            })
          : null;
      const email =
        'email' in selector
          ? selector.email
          : lookup?.subscriber?.scope === scope
            ? lookup.subscriber.email
            : undefined;
      if (email !== undefined) {
        // Also serializes creation when no row yet exists. Collisions only serialize
        // unrelated identities; scope/email equality is checked by every query/write.
        await manager.query(
          'SELECT pg_advisory_xact_lock(hashtextextended($1, 0))',
          [JSON.stringify(['newsletter-native', scope, email])],
        );
      }
      const subscriber =
        email === undefined
          ? null
          : await subscribers.findOne({
              where: { scope, email },
              lock: { mode: 'pessimistic_write' },
            });
      const token =
        subscriber && 'tokenHash' in selector
          ? await tokens.findOneBy({
              hash: selector.tokenHash,
              subscriberId: subscriber.id,
            })
          : null;
      let subscriberId = subscriber?.id;
      const tx: NewsletterNativeTransaction = {
        subscriber,
        token,
        saveSubscriber: async (record) => {
          if (
            email === undefined ||
            record.scope !== scope ||
            record.email !== email ||
            (subscriberId && record.id !== subscriberId)
          )
            throw new Error('Native transaction identity mismatch.');
          const values = {
            id: record.id,
            scope: record.scope,
            email: record.email,
            status: record.status,
            generation: record.generation,
            createdAt: record.createdAt,
            updatedAt: record.updatedAt,
            lastTokenIssuedAt: record.lastTokenIssuedAt,
          };
          if (subscriberId)
            await subscribers.update({ id: subscriberId }, values);
          else await subscribers.insert(values);
          subscriberId = record.id;
        },
        saveToken: async (record) => {
          if (!subscriberId || record.subscriberId !== subscriberId)
            throw new Error('Native transaction identity mismatch.');
          const values = {
            hash: record.hash,
            subscriberId: record.subscriberId,
            generation: record.generation,
            purpose: record.purpose,
            expiresAt: record.expiresAt,
            consumedAt: record.consumedAt,
          };
          // New verifiers must be unique, never overwrite another subscriber's token.
          if (token?.hash === record.hash)
            await tokens.update({ hash: record.hash, subscriberId }, values);
          else await tokens.insert(values);
        },
        deleteTokens: async (id, purpose) => {
          if (!subscriberId || id !== subscriberId)
            throw new Error('Native transaction identity mismatch.');
          await tokens.delete({
            subscriberId: id,
            ...(purpose ? { purpose } : {}),
          });
        },
        appendWithdrawal: async (event) => {
          if (!subscriberId || event.email !== email)
            throw new Error('Native transaction identity mismatch.');
          await manager.query(
            `INSERT INTO "newsletter"."consent_events"
            ("id","kind","email","recorded_at","event_source","dedupe_key")
            VALUES ($1,'withdrawn',$2,$3,$4,$5)
            ON CONFLICT ON CONSTRAINT "uq_newsletter_consent_event_identity" DO NOTHING`,
            [
              randomUUID(),
              event.email,
              event.recordedAt,
              event.eventSource,
              event.dedupeKey,
            ],
          );
        },
      };
      return operation(tx);
    });
  }
}
