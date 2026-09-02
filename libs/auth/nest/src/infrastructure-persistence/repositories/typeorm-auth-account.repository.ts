import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  AuthAccountRepository,
  CredentialAccount,
} from '../../application/ports/auth-account.repository';
import { AccountEntity } from '../entities/account.entity';

const CREDENTIAL_PROVIDER_ID = 'credential' as const;
const CREDENTIAL_ISSUER = 'local:credential';

@Injectable()
export class TypeormAuthAccountRepository implements AuthAccountRepository {
  constructor(
    @InjectRepository(AccountEntity)
    private readonly accountRepository: Repository<AccountEntity>,
  ) {}

  async findCredentialAccountByUserId(
    userId: string,
  ): Promise<CredentialAccount | null> {
    const account = await this.accountRepository.findOne({
      where: {
        accountId: userId,
        providerId: CREDENTIAL_PROVIDER_ID,
        issuer: CREDENTIAL_ISSUER,
      },
    });

    return account ? toCredentialAccount(account) : null;
  }

  async upsertCredentialAccount(input: {
    userId: string;
    passwordHash: string;
    createdAt?: Date;
    updatedAt?: Date;
  }): Promise<CredentialAccount> {
    const existingAccount = await this.accountRepository.findOne({
      where: {
        accountId: input.userId,
        providerId: CREDENTIAL_PROVIDER_ID,
        issuer: CREDENTIAL_ISSUER,
      },
    });

    const account = existingAccount
      ? this.accountRepository.merge(existingAccount, {
          password: input.passwordHash,
          updatedAt: input.updatedAt ?? new Date(),
        })
      : this.accountRepository.create({
          id: `${input.userId}-${CREDENTIAL_PROVIDER_ID}`,
          accountId: input.userId,
          providerId: CREDENTIAL_PROVIDER_ID,
          issuer: CREDENTIAL_ISSUER,
          userId: input.userId,
          password: input.passwordHash,
          createdAt: input.createdAt ?? new Date(),
          updatedAt: input.updatedAt ?? new Date(),
        });

    return toCredentialAccount(await this.accountRepository.save(account));
  }
}

function toCredentialAccount(account: AccountEntity): CredentialAccount {
  return {
    id: account.id,
    userId: account.userId,
    accountId: account.accountId,
    providerId: CREDENTIAL_PROVIDER_ID,
    password: account.password,
    createdAt: account.createdAt,
    updatedAt: account.updatedAt,
  };
}
