import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthStore } from '@anarchitects/auth-angular/state';
import { ActivateUserRequestDTO } from '@anarchitects/auth-ts/dtos';
import { AnarchitectsFeatureActivateUser } from './activate-user';

describe('AnarchitectsFeatureActivateUser', () => {
  let component: AnarchitectsFeatureActivateUser;
  let fixture: ComponentFixture<AnarchitectsFeatureActivateUser>;
  const mockAuthStore = {
    activateUser: vi.fn().mockResolvedValue(undefined),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnarchitectsFeatureActivateUser],
      providers: [{ provide: AuthStore, useValue: mockAuthStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(AnarchitectsFeatureActivateUser);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should delegate activation to AuthStore', async () => {
    const input: ActivateUserRequestDTO = { token: 'activate-token' };

    await component.submitForm(input);

    expect(mockAuthStore.activateUser).toHaveBeenCalledWith(input);
  });

  it('should skip submit when token is empty', async () => {
    await component.submitForm({ token: '' });

    expect(mockAuthStore.activateUser).not.toHaveBeenCalled();
  });
});
