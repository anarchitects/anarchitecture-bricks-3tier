import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AuthStore } from '@anarchitects/auth-angular/state';
import { AnarchitectsAuthUiLoginForm } from '@anarchitects/auth-angular/ui';
import { LoginRequestDTO } from '@anarchitects/auth-ts/dtos';
import type { FormsSchemaExtension } from '@anarchitects/forms-angular/ui';
import { By } from '@angular/platform-browser';
import { AnarchitectsFeatureLogin } from './login';

describe('AnarchitectsFeatureLogin', () => {
  let component: AnarchitectsFeatureLogin;
  let fixture: ComponentFixture<AnarchitectsFeatureLogin>;
  const mockAuthStore = {
    login: vi.fn().mockReturnValue({ destroy: vi.fn() }),
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
    vi.clearAllMocks();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('triggers reactive login without returning a completion promise', () => {
    const input: LoginRequestDTO = {
      credential: 'user@example.com',
      password: 'secret123',
    };

    expect(component.submitForm(input)).toBeUndefined();

    expect(mockAuthStore.login).toHaveBeenCalledWith(input);
  });

  it('should forward Signal Forms schema extensions to the UI form', async () => {
    const extension: FormsSchemaExtension = () => undefined;
    fixture.componentRef.setInput('schemaExtensions', [extension]);
    fixture.detectChanges();
    await fixture.whenStable();

    const uiForm = fixture.debugElement.query(
      By.directive(AnarchitectsAuthUiLoginForm),
    ).componentInstance as AnarchitectsAuthUiLoginForm;

    expect(uiForm.schemaExtensions()).toEqual([extension]);
  });
});
