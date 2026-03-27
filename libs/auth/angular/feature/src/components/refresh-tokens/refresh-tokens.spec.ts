import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthStore } from '@anarchitects/auth-angular/state';
import { RefreshTokenRequestDTO } from '@anarchitects/auth-ts/dtos';
import { AnarchitectsFeatureRefreshTokens } from './refresh-tokens';

describe('AnarchitectsFeatureRefreshTokens', () => {
  let component: AnarchitectsFeatureRefreshTokens;
  let fixture: ComponentFixture<AnarchitectsFeatureRefreshTokens>;
  const mockAuthStore = {
    refreshTokens: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnarchitectsFeatureRefreshTokens],
      providers: [{ provide: AuthStore, useValue: mockAuthStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(AnarchitectsFeatureRefreshTokens);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should call AuthStore.refreshTokens with the submitted dto', async () => {
    const input: RefreshTokenRequestDTO = { refreshToken: 'refresh-token' };

    await component.submitForm(input);

    expect(mockAuthStore.refreshTokens).toHaveBeenCalledWith(input);
  });

  it('should skip submit when refresh token is empty', async () => {
    await component.submitForm({ refreshToken: '' });

    expect(mockAuthStore.refreshTokens).not.toHaveBeenCalled();
  });
});
