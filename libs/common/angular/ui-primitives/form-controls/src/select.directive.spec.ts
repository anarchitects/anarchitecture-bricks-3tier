import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { AnarchitectsUiSelectDirective } from './select.directive';

@Component({
  imports: [AnarchitectsUiSelectDirective],
  template: `<select anarchitectsUiSelect [size]="'sm'" [invalid]="true">
    <option>A</option>
  </select>`,
})
class HostComponent {}

describe('AnarchitectsUiSelectDirective', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('should apply host attributes', () => {
    const select = fixture.nativeElement.querySelector(
      'select',
    ) as HTMLSelectElement;
    expect(select.getAttribute('data-size')).toBe('sm');
    expect(select.getAttribute('data-invalid')).toBe('true');
    expect(select.classList.contains('anx-select')).toBe(true);
  });
});
