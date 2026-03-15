import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { AnarchitectsUiField } from './field';
import { AnarchitectsUiInputDirective } from './input.directive';

@Component({
  imports: [AnarchitectsUiField, AnarchitectsUiInputDirective],
  template: `
    <anarchitects-ui-field [forId]="'email'" [required]="true" [invalid]="true">
      <span anxLabel>Email</span>
      <input id="email" anarchitectsUiInput [invalid]="true" />
      <span anxHint>Use work email</span>
      <span anxError>Invalid email</span>
    </anarchitects-ui-field>
  `,
})
class HostComponent {}

describe('AnarchitectsUiField', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('should render projected label and messages', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Email');
    expect(text).toContain('Use work email');
    expect(text).toContain('Invalid email');
  });

  it('should set invalid state on host', () => {
    const host = fixture.nativeElement.querySelector(
      'anarchitects-ui-field',
    ) as HTMLElement;
    expect(host.getAttribute('data-invalid')).toBe('true');
  });
});
