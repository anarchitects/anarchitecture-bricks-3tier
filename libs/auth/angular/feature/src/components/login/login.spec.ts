import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthStore } from '@anarchitects/auth-angular/state';
import { LoginRequestDTO } from '@anarchitects/auth-ts/dtos';
import { AnarchitectsFeatureLogin } from './login';

describe('AnarchitectsFeatureLogin', () => {
  let component: AnarchitectsFeatureLogin;
  let fixture: ComponentFixture<AnarchitectsFeatureLogin>;
  const mockAuthStore = {
    login: jest.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnarchitectsFeatureLogin],
      providers: [{ provide: AuthStore, useValue: mockAuthStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(AnarchitectsFeatureLogin);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should delegate login to AuthStore', async () => {
    const input: LoginRequestDTO = {
      credential: 'user@example.com',
      password: 'secret123',
    };

    await component.submitForm(input);

    expect(mockAuthStore.login).toHaveBeenCalledWith(input);
  });
});
