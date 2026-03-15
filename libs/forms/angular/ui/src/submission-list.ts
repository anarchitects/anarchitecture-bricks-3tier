import { Submission } from '@anarchitects/forms-ts/models';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
  output,
} from '@angular/core';
import { AnarchitectsUiButton } from '@anarchitects/common-angular-ui-primitives/actions';
import { AnarchitectsUiBadge } from '@anarchitects/common-angular-ui-primitives/feedback';
import { AnxSlotDirective } from '@anarchitects/common-angular-ui-composition/projection';
import { AnxTemplateDirective } from '@anarchitects/common-angular-ui-composition/templates';
import { AnxLayoutId } from '@anarchitects/common-angular-ui-layouts/contracts';
import { provideAnxDefaultLayouts } from '@anarchitects/common-angular-ui-layouts/defaults';
import { AnarchitectsUiLayoutHost } from '@anarchitects/common-angular-ui-layouts/host';

@Component({
  selector: 'anarchitects-forms-ui-submission-list',
  imports: [
    AnarchitectsUiLayoutHost,
    AnxTemplateDirective,
    AnxSlotDirective,
    AnarchitectsUiButton,
    AnarchitectsUiBadge,
  ],
  providers: [provideAnxDefaultLayouts()],
  templateUrl: './submission-list.html',
  styleUrl: './submission-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'anx-domain-component anx-forms-ui-submission-list anx-stack',
    'attr.data-anx-component': '"forms-ui-submission-list"',
  },
})
export class AnarchitectsFormsUiSubmissionList {
  readonly submissions = input<readonly Submission[]>([]);
  readonly title = input('Submissions');
  readonly layout = input<AnxLayoutId | null>(null);
  readonly layoutOptions = input<Readonly<Record<string, unknown>>>({});

  readonly selected = output<Submission>();

  readonly layoutModel = computed(() => ({
    title: this.title(),
    items: this.submissions(),
  }));

  onSelect(submission: Submission): void {
    this.selected.emit(submission);
  }

  payloadFieldCount(submission: Submission): number {
    return Object.keys(submission.payload).length;
  }

  formatDate(value: Date | string): string {
    const date = value instanceof Date ? value : new Date(value);
    return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleString();
  }
}
