import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AnarchitectsUiTextareaDirective } from './textarea.directive';

@Component({
  imports: [AnarchitectsUiTextareaDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<textarea
    anarchitectsUiTextarea
    [resize]="'none'"
    [invalid]="true"
  ></textarea>`,
})
class HostComponent {}

describe('AnarchitectsUiTextareaDirective', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('should apply attributes and resize style', () => {
    const textarea = fixture.nativeElement.querySelector(
      'textarea',
    ) as HTMLTextAreaElement;
    expect(textarea.getAttribute('data-invalid')).toBe('true');
    expect(textarea.style.resize).toBe('none');
    expect(textarea.classList.contains('anx-textarea')).toBe(true);
  });
});
