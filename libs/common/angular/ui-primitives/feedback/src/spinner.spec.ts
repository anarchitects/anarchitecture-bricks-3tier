import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AnarchitectsUiSpinner } from './spinner';

@Component({
  imports: [AnarchitectsUiSpinner],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<anarchitects-ui-spinner
    [size]="'lg'"
    [tone]="'danger'"
  ></anarchitects-ui-spinner>`,
})
class HostComponent {}

describe('AnarchitectsUiSpinner', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('should set role status and data attributes', () => {
    const host = fixture.nativeElement.querySelector(
      'anarchitects-ui-spinner',
    ) as HTMLElement;
    expect(host.getAttribute('role')).toBe('status');
    expect(host.getAttribute('data-size')).toBe('lg');
    expect(host.getAttribute('data-tone')).toBe('danger');
  });
});
