import { NgTemplateOutlet } from '@angular/common';
import {
  AfterViewInit,
  Component,
  Input,
  OnChanges,
  QueryList,
  TemplateRef,
  ViewChildren,
  ChangeDetectionStrategy,
} from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';
import { AnxTemplateDirective } from './template.directive';
import { findAnxTemplate } from './template-registry';

@Component({
  selector: 'anarchitects-template-composition-demo',
  standalone: true,
  imports: [NgTemplateOutlet, AnxTemplateDirective],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <ng-template anxTemplate="item" let-item>Item: {{ item.name }}</ng-template>
    <ng-template anxTemplate="item" anxTemplateVariant="compact" let-item>
      {{ item.name }}
    </ng-template>
    <ng-template anxTemplate="empty">No items available.</ng-template>

    <ng-container
      *ngTemplateOutlet="activeTemplate; context: activeContext"
    ></ng-container>
  `,
})
class AnxTemplateCompositionDemo implements AfterViewInit, OnChanges {
  @Input() mode: 'item' | 'empty' = 'item';
  @Input() variant: string | null = null;

  @ViewChildren(AnxTemplateDirective)
  templates!: QueryList<AnxTemplateDirective<{ $implicit: { name: string } }>>;

  activeTemplate: TemplateRef<{ $implicit: { name: string } }> | null = null;
  activeContext = { $implicit: { name: 'Alpha' } };

  ngAfterViewInit(): void {
    this.resolveTemplate();
    this.templates.changes.subscribe(() => this.resolveTemplate());
  }

  ngOnChanges(): void {
    this.resolveTemplate();
  }

  private resolveTemplate(): void {
    if (!this.templates) {
      return;
    }

    this.activeTemplate = findAnxTemplate(
      this.templates.toArray(),
      this.mode,
      this.variant,
    );
  }
}

const meta: Meta<AnxTemplateCompositionDemo> = {
  component: AnxTemplateCompositionDemo,
  title: 'UI Composition/Templates',
  args: {
    mode: 'item',
    variant: null,
  },
};

export default meta;
type Story = StoryObj<AnxTemplateCompositionDemo>;

export const ItemDefault: Story = {};

export const ItemCompact: Story = {
  args: {
    mode: 'item',
    variant: 'compact',
  },
};

export const Empty: Story = {
  args: {
    mode: 'empty',
    variant: null,
  },
};
