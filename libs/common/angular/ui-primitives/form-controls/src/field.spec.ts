import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AnarchitectsUiField } from './field';
import { AnarchitectsUiInputDirective } from './input.directive';

@Component({
  imports: [AnarchitectsUiField, AnarchitectsUiInputDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <anarchitects-ui-field [forId]="'email'" [required]="true" [invalid]="true">
      <span anxSlot="label">Email</span>
      <span anxLabel>Legacy label</span>
      <span anxSlot="start">@</span>
      <input id="email" anarchitectsUiInput [invalid]="true" />
      <span anxSlot="hint">Use work email</span>
      <span anxHint>Legacy hint</span>
      <span anxSlot="error">Invalid email</span>
      <span anxError>Legacy error</span>
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
    expect(text).toContain('Legacy label');
    expect(text).toContain('Legacy hint');
    expect(text).toContain('Legacy error');
  });

  it('should set invalid state on host', () => {
    const host = fixture.nativeElement.querySelector(
      'anarchitects-ui-field',
    ) as HTMLElement;
    expect(host.getAttribute('data-invalid')).toBe('true');
  });
});
