import {
  HttpClientTestingModule,
  HttpTestingController,
} from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideAuthConfig } from '@anarchitects/auth-angular/config';
import { LoginRequestDTO } from '@anarchitects/auth-ts/dtos';
import {
  JwtLogoutRequestDTO,
  RefreshTokenRequestDTO,
} from '@anarchitects/auth-ts/dtos/jwt';
import { JwtAuthApi } from './jwt-auth-api';

describe('JwtAuthApi', () => {
  let service: JwtAuthApi;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [provideAuthConfig({}), JwtAuthApi],
    });

    service = TestBed.inject(JwtAuthApi);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should POST to /api/auth/jwt/login', () => {
    const dto: LoginRequestDTO = {
      credential: 'user@example.com',
      password: 'secret',
    };

    service.login(dto).subscribe();

    const request = httpMock.expectOne('/api/auth/jwt/login');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(dto);
    request.flush({ accessToken: 'a', refreshToken: 'b' });
  });

  it('should POST to /api/auth/jwt/logout', () => {
    const dto: JwtLogoutRequestDTO = {
      accessToken: 'access-token',
      refreshToken: 'refresh-token',
    };

    service.logout(dto).subscribe();

    const request = httpMock.expectOne('/api/auth/jwt/logout');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(dto);
    request.flush({ success: true });
  });

  it('should POST to /api/auth/jwt/refresh', () => {
    const dto: RefreshTokenRequestDTO = {
      refreshToken: 'refresh-token',
    };

    service.refreshTokens(dto).subscribe();

    const request = httpMock.expectOne('/api/auth/jwt/refresh');
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual(dto);
    request.flush({ accessToken: 'a', refreshToken: 'b' });
  });
});
