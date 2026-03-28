import { Injectable } from '@nestjs/common';

export type CredentialAccount = {
  id: string;
  userId: string;
  accountId: string;
  providerId: 'credential';
  password: string | null;
  createdAt: Date;
  updatedAt: Date;
};

@Injectable()
export abstract class AuthAccountRepository {
  abstract findCredentialAccountByUserId(
    userId: string,
  ): Promise<CredentialAccount | null>;

  abstract upsertCredentialAccount(input: {
    userId: string;
    passwordHash: string;
    createdAt?: Date;
    updatedAt?: Date;
  }): Promise<CredentialAccount>;
}
