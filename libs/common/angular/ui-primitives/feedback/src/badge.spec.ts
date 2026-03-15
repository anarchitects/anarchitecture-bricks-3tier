import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { AnarchitectsUiBadge } from './badge';

@Component({
  imports: [AnarchitectsUiBadge],
  template: `<anarchitects-ui-badge [tone]="'success'"
    >Ready</anarchitects-ui-badge
  >`,
})
class HostComponent {}

describe('AnarchitectsUiBadge', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();
    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('should expose tone attribute', () => {
    const host = fixture.nativeElement.querySelector(
      'anarchitects-ui-badge',
    ) as HTMLElement;
    expect(host.getAttribute('data-tone')).toBe('success');
  });
});
