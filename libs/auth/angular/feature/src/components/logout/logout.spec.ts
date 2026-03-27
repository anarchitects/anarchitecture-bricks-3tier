import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthStore } from '@anarchitects/auth-angular/state';
import { LogoutRequestDTO } from '@anarchitects/auth-ts/dtos';
import { AnarchitectsFeatureLogout } from './logout';

describe('AnarchitectsFeatureLogout', () => {
  let component: AnarchitectsFeatureLogout;
  let fixture: ComponentFixture<AnarchitectsFeatureLogout>;
  const mockAuthStore = {
    logout: vi.fn().mockResolvedValue(undefined),
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
    vi.clearAllMocks();
  });

  it('should call AuthStore.logout when refresh token exists', async () => {
    const input: LogoutRequestDTO = {};

    await component.submitForm(input);

    expect(mockAuthStore.logout).toHaveBeenCalledWith(input);
  });

  it('should forward an empty core session logout payload', async () => {
    await component.submitForm({});

    expect(mockAuthStore.logout).toHaveBeenCalledWith({});
  });
});
