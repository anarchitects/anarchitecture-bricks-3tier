import {
  FormsStore,
  provideFormsState,
} from '@anarchitects/forms-angular/state';
import { AnarchitectsFormsUiSubmissionList } from '@anarchitects/forms-angular/ui';
import { Submission } from '@anarchitects/forms-ts/models';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
  output,
} from '@angular/core';
import { FormsLayoutId } from '@anarchitects/forms-angular/config';

@Component({
  selector: 'anarchitects-forms-feature-submission-list',
  imports: [AnarchitectsFormsUiSubmissionList],
  providers: [provideFormsState()],
  templateUrl: './submission-list.html',
  styleUrl: './submission-list.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'anx-domain-component anx-forms-feature-submission-list anx-stack',
    'attr.data-anx-component': '"forms-feature-submission-list"',
  },
})
export class AnarchitectsFeatureSubmissionList {
  private readonly store = inject(FormsStore);

  readonly formId = input<string | null>(null);
  readonly title = input('Submissions');
  readonly layout = input<FormsLayoutId | null>(null);
  readonly layoutOptions = input<Readonly<Record<string, unknown>>>({});

  readonly selected = output<Submission>();

  readonly submissions = computed(() => {
    const scopedFormId = this.formId();
    const allSubmissions = this.store.submissionsEntities();

    if (!scopedFormId) {
      return allSubmissions;
    }

    return allSubmissions.filter(
      (submission) => submission.formId === scopedFormId,
    );
  });

  onSelected(submission: Submission): void {
    this.selected.emit(submission);
  }
}
