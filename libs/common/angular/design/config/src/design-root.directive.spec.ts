import { Component, signal, ChangeDetectionStrategy } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideDesignSystemConfig } from './config.providers';
import { AnxDesignRootDirective } from './design-root.directive';

@Component({
  imports: [AnxDesignRootDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section anarchitectsDesignRoot></section>
    <section class="plain-host"></section>
  `,
})
class DefaultDesignRootHostComponent {}

@Component({
  imports: [AnxDesignRootDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      anarchitectsDesignRoot
      data-anx-theme="manual-theme"
      data-anx-density="compact"
    ></section>
  `,
})
class ManualAttributeDesignRootHostComponent {}

@Component({
  imports: [AnxDesignRootDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      anarchitectsDesignRoot
      data-anx-theme="manual-theme"
      [designTheme]="'input-theme'"
      [designDensity]="'compact'"
      [designSurface]="'card'"
    ></section>
  `,
})
class InputOverrideDesignRootHostComponent {}

@Component({
  imports: [AnxDesignRootDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <section
      anarchitectsDesignRoot
      [designTheme]="theme()"
      [designDensity]="density()"
      [designSurface]="surface()"
    ></section>
  `,
})
class RuntimeInputUpdateDesignRootHostComponent {
  readonly theme = signal('input-theme');
  readonly density = signal('compact');
  readonly surface = signal('card');
}

describe('AnxDesignRootDirective', () => {
  it('should require an explicit host element for root ownership', async () => {
    await TestBed.configureTestingModule({
      imports: [DefaultDesignRootHostComponent],
      providers: [
        ...provideDesignSystemConfig({
          theme: 'enterprise',
          density: 'compact',
          surface: 'card',
          layout: 'grid',
          columns: 3,
        }),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(DefaultDesignRootHostComponent);
    fixture.detectChanges();

    const [designRoot, plainHost] = Array.from(
      fixture.nativeElement.querySelectorAll('section'),
    ) as HTMLElement[];

    expect(designRoot.classList.contains('anx-root')).toBe(true);
    expect(designRoot.getAttribute('data-anx-theme')).toBe('enterprise');
    expect(designRoot.getAttribute('data-anx-density')).toBe('compact');
    expect(designRoot.getAttribute('data-anx-surface')).toBe('card');
    expect(designRoot.hasAttribute('data-anx-layout')).toBe(false);
    expect(designRoot.hasAttribute('data-anx-columns')).toBe(false);
    expect(plainHost.classList.contains('anx-root')).toBe(false);
  });

  it('should preserve explicit manual host attributes over provider values', async () => {
    await TestBed.configureTestingModule({
      imports: [ManualAttributeDesignRootHostComponent],
      providers: [
        ...provideDesignSystemConfig({
          theme: 'provider-theme',
          density: 'comfortable',
          surface: 'card',
          layout: 'grid',
          columns: 2,
        }),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(
      ManualAttributeDesignRootHostComponent,
    );
    fixture.detectChanges();

    const host = fixture.nativeElement.querySelector('section') as HTMLElement;

    expect(host.getAttribute('data-anx-theme')).toBe('manual-theme');
    expect(host.getAttribute('data-anx-density')).toBe('compact');
    expect(host.getAttribute('data-anx-surface')).toBe('card');
  });

  it('should allow directive inputs to override manual attributes and config', async () => {
    await TestBed.configureTestingModule({
      imports: [InputOverrideDesignRootHostComponent],
      providers: [
        ...provideDesignSystemConfig({
          theme: 'provider-theme',
          density: 'comfortable',
          surface: 'plain',
          layout: 'list',
          columns: 1,
        }),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(
      InputOverrideDesignRootHostComponent,
    );
    fixture.detectChanges();

    const host = fixture.nativeElement.querySelector('section') as HTMLElement;

    expect(host.getAttribute('data-anx-theme')).toBe('input-theme');
    expect(host.getAttribute('data-anx-density')).toBe('compact');
    expect(host.getAttribute('data-anx-surface')).toBe('card');
  });

  it('should update host attributes when directive inputs change at runtime', async () => {
    await TestBed.configureTestingModule({
      imports: [RuntimeInputUpdateDesignRootHostComponent],
      providers: [
        ...provideDesignSystemConfig({
          theme: 'provider-theme',
          density: 'comfortable',
          surface: 'plain',
          layout: 'list',
          columns: 1,
        }),
      ],
    }).compileComponents();

    const fixture = TestBed.createComponent(
      RuntimeInputUpdateDesignRootHostComponent,
    );
    fixture.detectChanges();

    const host = fixture.nativeElement.querySelector('section') as HTMLElement;
    expect(host.getAttribute('data-anx-theme')).toBe('input-theme');
    expect(host.getAttribute('data-anx-density')).toBe('compact');
    expect(host.getAttribute('data-anx-surface')).toBe('card');

    fixture.componentInstance.theme.set('updated-theme');
    fixture.componentInstance.density.set('comfortable');
    fixture.componentInstance.surface.set('plain');
    fixture.detectChanges();

    expect(host.getAttribute('data-anx-theme')).toBe('updated-theme');
    expect(host.getAttribute('data-anx-density')).toBe('comfortable');
    expect(host.getAttribute('data-anx-surface')).toBe('plain');
  });
});
