import { runConsumer } from './out/consumer.cjs';
import { validatePasskeyPersistence } from './auth-nest-passkey-persistence.mjs';
await runConsumer(validatePasskeyPersistence);
