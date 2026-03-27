import { Inject, Injectable } from '@nestjs/common';
import { AUTH_APPLICATION_MODULE_OPTIONS } from '../../application/application.module-definition';
import { AuthEnginePersistencePort } from '../../application/services/auth-engine-persistence.port';
import type { ResolvedAuthApplicationModuleOptions } from '../../config';

@Injectable()
export class BetterAuthIsolatedPersistenceAdapter
  implements AuthEnginePersistencePort
{
  constructor(
    @Inject(AUTH_APPLICATION_MODULE_OPTIONS)
    private readonly options: ResolvedAuthApplicationModuleOptions,
  ) {}

  resolveDatabase(): Promise<unknown> {
    return Promise.reject(
      new Error(
        `Better Auth isolated persistence for topology "${this.options.engineOptions.persistence.isolatedTopology}" is not implemented yet. See issue #167.`,
      ),
    );
  }
}
