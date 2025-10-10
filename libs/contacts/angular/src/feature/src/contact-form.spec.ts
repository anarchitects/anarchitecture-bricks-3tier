import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnarchitectsFeatureContactForm } from './contact-form';
import { Contact } from '@anarchitects/contacts-ts/models';
import { signal } from '@angular/core';
import { ContactRequestDto } from '@anarchitects/contacts-ts';
import { ContactStore } from '@anarchitects/contacts-angular/state';

describe('AnarchitectsFeatureContactForm', () => {
  let component: AnarchitectsFeatureContactForm;
  let fixture: ComponentFixture<AnarchitectsFeatureContactForm>;
  const mockContactStore = {
    entities: signal(new Array<Contact>()),
    ids: signal(new Array<string>()),
    loading: signal(false),
    error: signal<string | null>(null),
    success: signal(false),
    submitForm: () => {
      mockContactStore.success.set(true);
    },
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnarchitectsFeatureContactForm],
      providers: [{ provide: ContactStore, useValue: mockContactStore }],
    }).compileComponents();

    fixture = TestBed.createComponent(AnarchitectsFeatureContactForm);
    component = fixture.componentInstance;
    fixture.autoDetectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
  it('should have initial success as false', () => {
    expect(component.success()).toBe(false);
  });
  it('should set success to true after form submission', () => {
    const formData: ContactRequestDto = {
      name: 'Test User',
      email: 'test@example.com',
      message: 'This is a test message.',
    };
    component.form.setValue(formData);
    component.onSubmit();
    expect(component.success()).toBe(true);
  });
});
