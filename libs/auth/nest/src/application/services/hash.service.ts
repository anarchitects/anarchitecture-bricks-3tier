import { Injectable } from '@nestjs/common';

@Injectable()
export abstract class HashService {
  abstract hash(value: string | Buffer): Promise<string>;
  abstract compare(value: string | Buffer, hash: string): Promise<boolean>;
}
