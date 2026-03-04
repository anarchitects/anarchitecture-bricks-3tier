import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { AnarchitectsUiForm } from '@anarchitects/forms-angular/ui';
import { FormsStore } from '@anarchitects/forms-angular/state';
import { SubmissionRequestDTO } from '@anarchitects/forms-ts/dtos';

@Component({
  imports: [AnarchitectsUiForm, RouterModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class App {
  readonly store = inject(FormsStore);

  constructor() {
    this.store.getFormDefinition({ id: 'contact_default', version: 1 });
  }

  submit(dto: SubmissionRequestDTO) {
    this.store.submitForm(dto);
  }
}
