import { Injectable } from '@nestjs/common';

@Injectable()
export abstract class AuthEnginePersistencePort {
  abstract resolveDatabase(): Promise<unknown>;
}
