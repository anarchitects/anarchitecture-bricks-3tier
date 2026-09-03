import { FormsLayoutId } from '@anarchitects/forms-angular/config';
import { Submission } from '@anarchitects/forms-ts/models';
import { NgTemplateOutlet } from '@angular/common';
import {
  ChangeDetectionStrategy,
  Component,
  TemplateRef,
  computed,
  contentChildren,
  input,
} from '@angular/core';
import { AnarchitectsFormsTemplateDirective } from './projection';

type SubmissionPayloadEntry = {
  key: string;
  value: string;
};

@Component({
  selector: 'anarchitects-forms-ui-submission-detail',
  imports: [NgTemplateOutlet],
  templateUrl: './submission-detail.html',
  styleUrl: './submission-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'anx-domain-component anx-forms-ui-submission-detail',
    'attr.data-anx-component': '"forms-ui-submission-detail"',
    '[attr.data-anx-layout]': 'layoutVariant()',
  },
})
export class AnarchitectsFormsUiSubmissionDetail {
  private readonly templates = contentChildren(
    AnarchitectsFormsTemplateDirective,
  );

  readonly submission = input<Submission | null>(null);
  readonly title = input('Submission details');
  readonly layout = input<FormsLayoutId | null>(null);
  readonly layoutOptions = input<Readonly<Record<string, unknown>>>({});
  readonly layoutVariant = computed(
    () => this.layout()?.split(':', 2)[1] ?? 'detail',
  );
  readonly layoutModel = computed(() => ({
    title: this.title(),
    data: this.submission(),
  }));

  template(name: string): TemplateRef<unknown> | null {
    return (
      this.templates().find((entry) => entry.anxTemplate() === name)
        ?.templateRef ?? null
    );
  }

  payloadEntries(submission: Submission): SubmissionPayloadEntry[] {
    return Object.entries(submission.payload).map(([key, value]) => ({
      key,
      value: this.stringifyPayloadValue(value),
    }));
  }

  formatDate(value: Date | string): string {
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
  }

  private stringifyPayloadValue(value: unknown): string {
    if (typeof value === 'string') {
      return value;
    }
    if (typeof value === 'number' || typeof value === 'boolean') {
      return String(value);
    }
    if (value === null || value === undefined) {
      return '';
    }
    return JSON.stringify(value);
  }
}
