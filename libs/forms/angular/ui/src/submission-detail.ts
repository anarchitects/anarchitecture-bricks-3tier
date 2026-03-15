import { Submission } from '@anarchitects/forms-ts/models';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from '@angular/core';
import { AnarchitectsUiAlert } from '@anarchitects/common-angular-ui-primitives/feedback';
import { AnxSlotDirective } from '@anarchitects/common-angular-ui-composition/projection';
import { AnxTemplateDirective } from '@anarchitects/common-angular-ui-composition/templates';
import { AnxLayoutId } from '@anarchitects/common-angular-ui-layouts/contracts';
import { provideAnxDefaultLayouts } from '@anarchitects/common-angular-ui-layouts/defaults';
import { AnarchitectsUiLayoutHost } from '@anarchitects/common-angular-ui-layouts/host';

type SubmissionPayloadEntry = {
  key: string;
  value: string;
};

@Component({
  selector: 'anarchitects-forms-ui-submission-detail',
  imports: [
    AnarchitectsUiLayoutHost,
    AnxTemplateDirective,
    AnxSlotDirective,
    AnarchitectsUiAlert,
  ],
  providers: [provideAnxDefaultLayouts()],
  templateUrl: './submission-detail.html',
  styleUrl: './submission-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'anx-domain-component anx-forms-ui-submission-detail anx-stack',
    'attr.data-anx-component': '"forms-ui-submission-detail"',
  },
})
export class AnarchitectsFormsUiSubmissionDetail {
  readonly submission = input<Submission | null>(null);
  readonly title = input('Submission details');
  readonly layout = input<AnxLayoutId | null>(null);
  readonly layoutOptions = input<Readonly<Record<string, unknown>>>({});

  readonly layoutModel = computed(() => ({
    title: this.title(),
    data: this.submission(),
  }));

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
