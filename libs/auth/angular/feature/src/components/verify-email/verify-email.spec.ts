import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthStore } from '@anarchitects/auth-angular/state';
import { VerifyEmailRequestDTO } from '@anarchitects/auth-ts/dtos';
import { AnarchitectsFeatureVerifyEmail } from './verify-email';

describe('AnarchitectsFeatureVerifyEmail', () => {
  let component: AnarchitectsFeatureVerifyEmail;
  let fixture: ComponentFixture<AnarchitectsFeatureVerifyEmail>;
  const mockAuthStore = {
    verifyEmail: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnarchitectsFeatureVerifyEmail],
      providers: [{ provide: AuthStore, useValue: mockAuthStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(AnarchitectsFeatureVerifyEmail);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should delegate verify-email action to AuthStore', async () => {
    const input: VerifyEmailRequestDTO = { token: 'verify-token' };

    await component.submitForm(input);

    expect(mockAuthStore.verifyEmail).toHaveBeenCalledWith(input);
  });

  it('should skip submit when token is empty', async () => {
    await component.submitForm({ token: '' });

    expect(mockAuthStore.verifyEmail).not.toHaveBeenCalled();
  });
});
