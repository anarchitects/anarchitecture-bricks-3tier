import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Component, signal } from '@angular/core';
import { AnarchitectsUiButton } from './button';

@Component({
  imports: [AnarchitectsUiButton],
  template: `
    <anarchitects-ui-button
      [tone]="tone()"
      [appearance]="appearance()"
      [size]="size()"
      [density]="density()"
      [loading]="loading()"
      (pressed)="onPressed()"
    >
      <span anxStart>start</span>
      Save
      <span anxEnd>end</span>
    </anarchitects-ui-button>
  `,
})
class HostComponent {
  readonly tone = signal<'neutral' | 'primary' | 'success' | 'danger'>(
    'primary',
  );
  readonly appearance = signal<'solid' | 'outline' | 'ghost'>('solid');
  readonly size = signal<'sm' | 'md' | 'lg'>('md');
  readonly density = signal<'compact' | 'comfortable'>('comfortable');
  readonly loading = signal(false);

  pressedCount = 0;

  onPressed(): void {
    this.pressedCount += 1;
  }
}

describe('AnarchitectsUiButton', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('should expose variant attributes on host', () => {
    const host = fixture.nativeElement.querySelector(
      'anarchitects-ui-button',
    ) as HTMLElement;
    expect(host.getAttribute('data-tone')).toBe('primary');
    expect(host.getAttribute('data-appearance')).toBe('solid');
    expect(host.getAttribute('data-size')).toBe('md');
    expect(host.getAttribute('data-density')).toBe('comfortable');
  });

  it('should emit pressed on click', () => {
    const button = fixture.nativeElement.querySelector(
      'button',
    ) as HTMLButtonElement;
    button.click();
    expect(fixture.componentInstance.pressedCount).toBe(1);
  });

  it('should not emit when loading', () => {
    fixture.componentInstance.loading.set(true);
    fixture.detectChanges();

    const button = fixture.nativeElement.querySelector(
      'button',
    ) as HTMLButtonElement;
    button.click();
    expect(fixture.componentInstance.pressedCount).toBe(0);
  });
});
