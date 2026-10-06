import { FormsLayoutId } from '@anarchitects/forms-angular/config';
import { FormsStore } from '@anarchitects/forms-angular/state';
import {
  AnarchitectsFormsUiSubmissionDetail,
  AnarchitectsFormsUiSubmissionList,
} from '@anarchitects/forms-angular/ui';
import { Submission } from '@anarchitects/forms-ts/models';
import {
  ChangeDetectionStrategy,
  Component,
  inject,
  input,
  OnChanges,
  OnInit,
  output,
  SimpleChanges,
} from '@angular/core';

@Component({
  selector: 'anarchitects-forms-feature-submissions-admin',
  imports: [
    AnarchitectsFormsUiSubmissionList,
    AnarchitectsFormsUiSubmissionDetail,
  ],
  templateUrl: './submissions-admin.html',
  styleUrl: './submissions-admin.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    class: 'anx-domain-component anx-forms-feature-submissions-admin',
    'attr.data-anx-component': '"forms-feature-submissions-admin"',
  },
})
export class AnarchitectsFeatureSubmissionsAdmin implements OnInit, OnChanges {
  protected readonly store = inject(FormsStore);
  private initialized = false;

  readonly formId = input<string>();
  readonly formVersion = input<number>();
  readonly submissionId = input<string | null>();
  readonly listTitle = input('Submissions');
  readonly detailTitle = input('Submission details');
  readonly listLayout = input<FormsLayoutId | null>(null);
  readonly detailLayout = input<FormsLayoutId | null>(null);
  readonly listLayoutOptions = input<Readonly<Record<string, unknown>>>({});
  readonly detailLayoutOptions = input<Readonly<Record<string, unknown>>>({});
  readonly selected = output<Submission>();

  ngOnInit(): void {
    this.initialized = true;
    this.reload();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (this.initialized && (changes['formId'] || changes['formVersion'])) {
      this.reload();
    }
    if (changes['submissionId']) {
      this.store.loadSubmission(this.submissionId() ?? null);
    }
  }

  reload(): void {
    this.store.loadSubmissions({
      formId: this.formId(),
      formVersion: this.formVersion(),
    });
  }

  retryDetail(): void {
    const id = this.store.selectedSubmissionId();
    if (id !== null) {
      this.store.loadSubmission(id);
    }
  }

  onSelected(submission: Submission): void {
    this.store.loadSubmission(submission.id);
    this.selected.emit(submission);
  }
}
