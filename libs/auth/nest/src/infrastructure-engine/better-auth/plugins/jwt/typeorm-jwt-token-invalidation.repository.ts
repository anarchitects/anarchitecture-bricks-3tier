import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InvalidatedTokenEntity } from '../../../../infrastructure-persistence/entities/invalidated-token.entity';
import { JwtTokenInvalidationRepository } from './jwt-token-invalidation.repository';

@Injectable()
export class TypeormJwtTokenInvalidationRepository
  implements JwtTokenInvalidationRepository
{
  constructor(
    @InjectRepository(InvalidatedTokenEntity)
    private readonly invalidatedTokenRepository: Repository<InvalidatedTokenEntity>,
  ) {}

  async invalidateTokens(
    tokens: string[],
    userId: string | null,
  ): Promise<void> {
    const invalidatedTokens = tokens.map((token) =>
      this.invalidatedTokenRepository.create({
        tokenId: token,
        userId,
      }),
    );
    await this.invalidatedTokenRepository.save(invalidatedTokens);
  }

  async isTokenInvalidated(tokenId: string): Promise<boolean> {
    const token = await this.invalidatedTokenRepository.findOne({
      where: { tokenId },
    });
    return !!token;
  }
}
