import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, ChangeDetectionStrategy } from '@angular/core';
import { AnarchitectsUiBadge } from './badge';

@Component({
  imports: [AnarchitectsUiBadge],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <anarchitects-ui-badge [tone]="'success'">
      <span anxSlot="start">#</span>
      Ready
      <span anxEnd>Legacy</span>
    </anarchitects-ui-badge>
  `,
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

  it('should project canonical and legacy slot content', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Ready');
    expect(text).toContain('#');
    expect(text).toContain('Legacy');
  });
});
