import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component } from '@angular/core';
import { AnarchitectsUiCard } from './card';

@Component({
  imports: [AnarchitectsUiCard],
  template: `
    <anarchitects-ui-card [appearance]="'elevated'">
      <span anxCardHeader>Profile</span>
      Body content
      <span anxCardFooter>Updated now</span>
    </anarchitects-ui-card>
  `,
})
class HostComponent {}

describe('AnarchitectsUiCard', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('should render projected sections', () => {
    const text = fixture.nativeElement.textContent as string;
    expect(text).toContain('Profile');
    expect(text).toContain('Body content');
    expect(text).toContain('Updated now');
  });

  it('should expose appearance attribute', () => {
    const host = fixture.nativeElement.querySelector(
      'anarchitects-ui-card',
    ) as HTMLElement;
    expect(host.getAttribute('data-appearance')).toBe('elevated');
  });
});
