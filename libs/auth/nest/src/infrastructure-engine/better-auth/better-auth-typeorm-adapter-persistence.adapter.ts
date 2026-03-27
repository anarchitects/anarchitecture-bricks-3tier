import { Injectable } from '@nestjs/common';
import { AuthEnginePersistencePort } from '../../application/services/auth-engine-persistence.port';

@Injectable()
export class BetterAuthTypeormAdapterPersistenceAdapter
  implements AuthEnginePersistencePort
{
  resolveDatabase(): Promise<unknown> {
    return Promise.reject(
      new Error(
        'Better Auth TypeORM adapter persistence is not implemented yet. See issue #168.',
      ),
    );
  }
}
