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
  output,
} from '@angular/core';
import { AnarchitectsFormsTemplateDirective } from './projection';

@Component({
  selector: 'anarchitects-forms-ui-submission-list',
  imports: [NgTemplateOutlet],
  templateUrl: './submission-list.html',
  styleUrl: './submission-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'anx-domain-component anx-forms-ui-submission-list',
    'attr.data-anx-component': '"forms-ui-submission-list"',
    '[attr.data-anx-layout]': 'layoutVariant()',
    '[style.--anx-forms-list-columns]': 'columns()',
  },
})
export class AnarchitectsFormsUiSubmissionList {
  private readonly templates = contentChildren(
    AnarchitectsFormsTemplateDirective,
  );

  readonly submissions = input<readonly Submission[]>([]);
  readonly title = input('Submissions');
  readonly layout = input<FormsLayoutId | null>(null);
  readonly layoutOptions = input<Readonly<Record<string, unknown>>>({});
  readonly selected = output<Submission>();

  readonly layoutVariant = computed(
    () => this.layout()?.split(':', 2)[1] ?? 'list',
  );
  readonly columns = computed(
    () => Number(this.layoutOptions()['columns']) || 1,
  );
  readonly layoutModel = computed(() => ({
    title: this.title(),
    items: this.submissions(),
  }));

  template(name: string): TemplateRef<unknown> | null {
    return (
      this.templates().find((entry) => entry.anxTemplate() === name)
        ?.templateRef ?? null
    );
  }

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
