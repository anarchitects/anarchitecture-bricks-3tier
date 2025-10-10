import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnarchitectsUiContactForm } from './form';
import { ComponentRef } from '@angular/core';
import { FormControl, FormGroup, Validators } from '@angular/forms';

describe('AnarchitectsUiContactForm', () => {
  let component: AnarchitectsUiContactForm;
  let fixture: ComponentFixture<AnarchitectsUiContactForm>;
  let componentRef: ComponentRef<AnarchitectsUiContactForm>;
  const contactForm = new FormGroup({
    name: new FormControl('', Validators.required),
    email: new FormControl('', [Validators.required, Validators.email]),
    message: new FormControl('', Validators.required),
  });

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnarchitectsUiContactForm],
    }).compileComponents();

    fixture = TestBed.createComponent(AnarchitectsUiContactForm);
    component = fixture.componentInstance;
    componentRef = fixture.componentRef;
    componentRef.setInput('contactForm', contactForm);
    fixture.autoDetectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should have a form with 3 controls', () => {
    expect(component.contactForm().contains('name')).toBeTruthy();
    expect(component.contactForm().contains('email')).toBeTruthy();
    expect(component.contactForm().contains('message')).toBeTruthy();
  });
  it('should make the name control required', () => {
    const control = component.contactForm().get('name');
    control?.setValue('');
    expect(control?.valid).toBeFalsy();
  });
  it('should make the email control required and validate email format', () => {
    const control = component.contactForm().get('email');
    control?.setValue('');
    expect(control?.valid).toBeFalsy();
    control?.setValue('invalid-email');
    expect(control?.valid).toBeFalsy();
    control?.setValue('test@example.com');
    expect(control?.valid).toBeTruthy();
  });
  it('should make the message control required', () => {
    const control = component.contactForm().get('message');
    control?.setValue('');
    expect(control?.valid).toBeFalsy();
  });
});
