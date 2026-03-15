import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthStore } from '@anarchitects/auth-angular/state';
import { LogoutRequestDTO } from '@anarchitects/auth-ts/dtos';
import { AnarchitectsFeatureLogout } from './logout';

describe('AnarchitectsFeatureLogout', () => {
  let component: AnarchitectsFeatureLogout;
  let fixture: ComponentFixture<AnarchitectsFeatureLogout>;
  const mockAuthStore = {
    logout: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnarchitectsFeatureLogout],
      providers: [{ provide: AuthStore, useValue: mockAuthStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(AnarchitectsFeatureLogout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should call AuthStore.logout when refresh token exists', async () => {
    const input: LogoutRequestDTO = {
      refreshToken: 'refresh-token',
      accessToken: 'access-token',
    };

    await component.submitForm(input);

    expect(mockAuthStore.logout).toHaveBeenCalledWith(input);
  });

  it('should skip submit when refresh token is missing', async () => {
    await component.submitForm({ refreshToken: '' });

    expect(mockAuthStore.logout).not.toHaveBeenCalled();
  });
});
