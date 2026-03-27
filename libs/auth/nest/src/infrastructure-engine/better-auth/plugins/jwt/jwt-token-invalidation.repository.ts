import { Injectable } from '@nestjs/common';

@Injectable()
export abstract class JwtTokenInvalidationRepository {
  abstract invalidateTokens(
    tokens: string[],
    userId: string | null,
  ): Promise<void>;

  abstract isTokenInvalidated(tokenId: string): Promise<boolean>;
}
