import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthJwtStore } from '@anarchitects/auth-angular/state/jwt';
import { RefreshTokenRequestDTO } from '@anarchitects/auth-ts/dtos/jwt';
import { AnarchitectsAuthJwtRefreshTokens } from './refresh-tokens';

describe('AnarchitectsAuthJwtRefreshTokens', () => {
  let component: AnarchitectsAuthJwtRefreshTokens;
  let fixture: ComponentFixture<AnarchitectsAuthJwtRefreshTokens>;
  const mockAuthJwtStore = {
    refreshTokens: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnarchitectsAuthJwtRefreshTokens],
      providers: [{ provide: AuthJwtStore, useValue: mockAuthJwtStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(AnarchitectsAuthJwtRefreshTokens);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should call AuthJwtStore.refreshTokens with the submitted dto', async () => {
    const input: RefreshTokenRequestDTO = { refreshToken: 'refresh-token' };

    await component.submitForm(input);

    expect(mockAuthJwtStore.refreshTokens).toHaveBeenCalledWith(input);
  });

  it('should still delegate empty input handling to the JWT state layer', async () => {
    await component.submitForm({ refreshToken: '' });

    expect(mockAuthJwtStore.refreshTokens).toHaveBeenCalledWith({
      refreshToken: '',
    });
  });
});
