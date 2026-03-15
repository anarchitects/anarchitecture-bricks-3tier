import {
  FormsStore,
  provideFormsState,
} from '@anarchitects/forms-angular/state';
import { AnarchitectsFormsUiSubmissionDetail } from '@anarchitects/forms-angular/ui';
import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  input,
} from '@angular/core';
import { AnxLayoutId } from '@anarchitects/common-angular-ui-layouts/contracts';

@Component({
  selector: 'anarchitects-forms-feature-submission-detail',
  imports: [AnarchitectsFormsUiSubmissionDetail],
  providers: [provideFormsState()],
  templateUrl: './submission-detail.html',
  styleUrl: './submission-detail.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'anx-domain-component anx-forms-feature-submission-detail anx-stack',
    'attr.data-anx-component': '"forms-feature-submission-detail"',
  },
})
export class AnarchitectsFeatureSubmissionDetail {
  private readonly store = inject(FormsStore);

  readonly submissionId = input<string | null>(null);
  readonly title = input('Submission details');
  readonly layout = input<AnxLayoutId | null>(null);
  readonly layoutOptions = input<Readonly<Record<string, unknown>>>({});

  readonly submission = computed(() => {
    const entries = this.store.submissionsEntities();
    const selectedId = this.submissionId();

    if (selectedId) {
      return entries.find((entry) => entry.id === selectedId) ?? null;
    }

    return entries[0] ?? null;
  });
}
