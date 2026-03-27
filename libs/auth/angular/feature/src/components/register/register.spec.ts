import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthStore } from '@anarchitects/auth-angular/state';
import { RegisterRequestDTO } from '@anarchitects/auth-ts/dtos';
import { AnarchitectsFeatureRegister } from './register';

describe('AnarchitectsFeatureRegister', () => {
  let component: AnarchitectsFeatureRegister;
  let fixture: ComponentFixture<AnarchitectsFeatureRegister>;
  const mockAuthStore = {
    registerUser: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnarchitectsFeatureRegister],
      providers: [{ provide: AuthStore, useValue: mockAuthStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(AnarchitectsFeatureRegister);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should delegate registration to AuthStore', async () => {
    const input: RegisterRequestDTO = {
      name: 'Jane',
      email: 'jane@example.com',
      password: 'secret123',
      confirmPassword: 'secret123',
    };

    await component.submitForm(input);

    expect(mockAuthStore.registerUser).toHaveBeenCalledWith(input);
  });
});
