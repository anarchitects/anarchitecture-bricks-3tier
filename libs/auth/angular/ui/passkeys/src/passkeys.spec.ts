import { provideZonelessChangeDetection } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { AnarchitectsAuthUiPasskeys } from './passkeys';

function setup() {
  TestBed.configureTestingModule({
    providers: [provideZonelessChangeDetection()],
  });
  return TestBed.createComponent(AnarchitectsAuthUiPasskeys);
}
describe('AnarchitectsAuthUiPasskeys', () => {
  afterEach(() => TestBed.resetTestingModule());
  it('shows unsupported guidance without an action', async () => {
    const fixture = setup();
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('button')).toBeNull();
    expect(
      fixture.nativeElement.querySelector('[role="status"]').textContent,
    ).toContain('not supported');
  });
  it('emits explicit actions, disables duplicate submissions, and permits cancellation', async () => {
    const fixture = setup();
    const requested = vi.fn();
    const cancelled = vi.fn();
    fixture.componentInstance.requested.subscribe(requested);
    fixture.componentInstance.cancelRequested.subscribe(cancelled);
    fixture.componentRef.setInput('supported', true);
    await fixture.whenStable();
    expect(requested).not.toHaveBeenCalled();
    fixture.nativeElement.querySelector('button').click();
    expect(requested).toHaveBeenCalledOnce();
    fixture.componentRef.setInput('loading', true);
    await fixture.whenStable();
    const buttons = fixture.nativeElement.querySelectorAll('button');
    expect(buttons[0].disabled).toBe(true);
    buttons[0].click();
    expect(requested).toHaveBeenCalledOnce();
    buttons[1].click();
    expect(cancelled).toHaveBeenCalledOnce();
  });
  it('supports enrollment, translated text, and accessible status/errors', async () => {
    const fixture = setup();
    fixture.componentRef.setInput('supported', true);
    fixture.componentRef.setInput('mode', 'enroll');
    fixture.componentRef.setInput('labels', {
      enroll: 'Register key',
      completed: 'Ready',
    });
    fixture.componentRef.setInput('success', true);
    await fixture.whenStable();
    expect(fixture.nativeElement.querySelector('button').textContent).toContain(
      'Register key',
    );
    expect(
      fixture.nativeElement.querySelector('[aria-live="polite"]').textContent,
    ).toContain('Ready');
    fixture.componentRef.setInput('error', 'Verification failed');
    await fixture.whenStable();
    expect(
      fixture.nativeElement.querySelector('[role="alert"]').textContent,
    ).toBe('Verification failed');
  });
});
