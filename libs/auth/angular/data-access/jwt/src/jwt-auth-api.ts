import { injectApiResourcePath } from '@anarchitects/auth-angular/config';
import { LoginRequestDTO } from '@anarchitects/auth-ts/dtos';
import {
  JwtLogoutRequestDTO,
  LoginResponseDTO,
  RefreshTokenRequestDTO,
  RefreshTokenResponseDTO,
} from '@anarchitects/auth-ts/dtos/jwt';
import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class JwtAuthApi {
  private readonly http = inject(HttpClient);
  private readonly resourceUrl = `/api/${injectApiResourcePath()}`;

  login(dto: LoginRequestDTO) {
    return this.http.post<LoginResponseDTO>(`${this.resourceUrl}/jwt/login`, dto);
  }

  logout(dto: JwtLogoutRequestDTO) {
    return this.http.post<{ success: boolean }>(
      `${this.resourceUrl}/jwt/logout`,
      dto,
    );
  }

  refreshTokens(dto: RefreshTokenRequestDTO) {
    return this.http.post<RefreshTokenResponseDTO>(
      `${this.resourceUrl}/jwt/refresh`,
      dto,
    );
  }
}
