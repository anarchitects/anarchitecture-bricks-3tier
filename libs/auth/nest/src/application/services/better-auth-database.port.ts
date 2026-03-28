import { Injectable } from '@nestjs/common';

@Injectable()
export abstract class BetterAuthDatabasePort {
  abstract resolveDatabase(): Promise<unknown>;
}
