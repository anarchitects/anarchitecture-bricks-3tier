import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { AnarchitectsUiAlert } from './alert';

@Component({
  imports: [AnarchitectsUiAlert],
  template: `
    <anarchitects-ui-alert
      [tone]="'danger'"
      [dismissible]="true"
      (dismissed)="count = count + 1"
    >
      Something happened
    </anarchitects-ui-alert>
  `,
})
class HostComponent {
  count = 0;
}

describe('AnarchitectsUiAlert', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('should expose alert role for danger tone', () => {
    const host = fixture.nativeElement.querySelector(
      'anarchitects-ui-alert',
    ) as HTMLElement;
    expect(host.getAttribute('role')).toBe('alert');
  });

  it('should emit dismissed', () => {
    const dismissButton = fixture.nativeElement.querySelector(
      '.anx-alert__dismiss',
    ) as HTMLButtonElement;
    dismissButton.click();
    expect(fixture.componentInstance.count).toBe(1);
  });
});
