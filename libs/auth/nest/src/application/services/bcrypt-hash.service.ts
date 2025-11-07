import { Injectable } from '@nestjs/common';
import { HashService } from './hash.service';
import { compare, genSalt, hash } from 'bcrypt';

@Injectable()
export class BcryptHashService implements HashService {
  async hash(value: string | Buffer): Promise<string> {
    const salt = await genSalt();
    return hash(value, salt);
  }
  compare(value: string | Buffer, hash: string): Promise<boolean> {
    return compare(value, hash);
  }
}
