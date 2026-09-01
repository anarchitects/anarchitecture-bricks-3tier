import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AnarchitectsUiInputDirective } from './input.directive';

@Component({
  imports: [AnarchitectsUiInputDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<input anarchitectsUiInput [size]="'lg'" [invalid]="true" />`,
})
class HostComponent {}

describe('AnarchitectsUiInputDirective', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('should apply data attributes', () => {
    const input = fixture.nativeElement.querySelector(
      'input',
    ) as HTMLInputElement;
    expect(input.getAttribute('data-size')).toBe('lg');
    expect(input.getAttribute('data-invalid')).toBe('true');
    expect(input.classList.contains('anx-input')).toBe(true);
  });
});
