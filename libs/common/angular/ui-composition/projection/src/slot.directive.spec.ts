import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { AnxSlotDirective } from './slot.directive';

@Component({
  imports: [AnxSlotDirective],
  template: `
    <div id="known" anxSlot="header">Known</div>
    <div id="alias" anxSlot="anxCardHeader">Alias</div>
    <div id="custom" anxSlot="app-dashboard-widget">Custom</div>
    <div id="invalid" anxSlot="dashboard-widget">Invalid</div>
  `,
})
class HostComponent {}

describe('AnxSlotDirective', () => {
  let fixture: ComponentFixture<HostComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    fixture.detectChanges();
  });

  it('should normalize known, alias, and app-prefixed slot values', () => {
    const known = fixture.nativeElement.querySelector('#known') as HTMLElement;
    const alias = fixture.nativeElement.querySelector('#alias') as HTMLElement;
    const custom = fixture.nativeElement.querySelector(
      '#custom',
    ) as HTMLElement;

    expect(known.getAttribute('data-anx-slot')).toBe('header');
    expect(alias.getAttribute('data-anx-slot')).toBe('header');
    expect(custom.getAttribute('data-anx-slot')).toBe('app-dashboard-widget');
  });

  it('should clear data attribute for invalid slot values', () => {
    const invalid = fixture.nativeElement.querySelector(
      '#invalid',
    ) as HTMLElement;
    expect(invalid.getAttribute('data-anx-slot')).toBeNull();
  });
});
